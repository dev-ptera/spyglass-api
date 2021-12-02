import { QuorumDto, SupplyDto } from '@app/types';
import { NANO_CLIENT } from '@app/config';
import { convertFromRaw, getOfflineRepresentativesPromise, getSupplyPromise, LOG_ERR } from '@app/services';
import { ConfirmationQuorumResponse } from '@dev-ptera/nano-node-rpc';

/** Returns online / offline representative weights & percentages. */
const calculateWeightStatus = async (nonBurnSupply: number, onlineWeight: number): Promise<Partial<QuorumDto>> => {
    const offlineReps = await getOfflineRepresentativesPromise().catch((err) =>
        Promise.reject(LOG_ERR('calcOnlineOfflineRepWeights.getOfflineRepresentativesPromise', err))
    );

    // Given a large amount of offline reps, loop list & aggregate weights.
    let offlineWeight = 0;
    offlineReps.map((rep) => (offlineWeight += rep.weight));

    // This number represents the aggregate amount sent to non-opened, non-burn accounts.
    // This number can be decreased by increasing the number of designated burn accounts.
    const noRepWeight = nonBurnSupply - onlineWeight - offlineWeight;

    return {
        noRepWeight,
        noRepPercent: noRepWeight / nonBurnSupply,
        offlineWeight,
        offlinePercent: offlineWeight / nonBurnSupply,
        onlinePercent: onlineWeight / nonBurnSupply,
    };
};

/** Calculates the non-burned supply amount. */
const calculateNonBurnedSupply = (supply: SupplyDto) => supply.totalAmount - supply.burnedAmount;

/** Converts RPC raw values to numbers. */
const convertRaw = (rawQuorum: ConfirmationQuorumResponse): Partial<QuorumDto> => ({
    quorumDelta: convertFromRaw(rawQuorum.quorum_delta),
    onlineWeight: convertFromRaw(rawQuorum.online_stake_total),
    peersStakeWeight: convertFromRaw(rawQuorum.peers_stake_total),
    onlineWeightQuorumPercent: Number(rawQuorum.online_weight_quorum_percent),
    onlineWeightMinimum: convertFromRaw(rawQuorum.online_weight_minimum),
});

/** Returns quorum statistics; for example online / offline representative stats. */
export const getQuorumPromise = async (): Promise<QuorumDto> => {
    const { quorumDelta, peersStakeWeight, onlineWeightQuorumPercent, onlineWeight, onlineWeightMinimum } =
        await NANO_CLIENT.confirmation_quorum()
            .then(convertRaw)
            .catch((err) => Promise.reject(LOG_ERR('getQuorumPromise.confirmation_quorum', err)));

    const nonBurnedSupply = await getSupplyPromise()
        .then(calculateNonBurnedSupply)
        .catch((err) => Promise.reject(LOG_ERR('getQuorumPromise.getSupplyPromise', err)));

    const { noRepPercent, noRepWeight, offlinePercent, offlineWeight, onlinePercent } = await calculateWeightStatus(
        nonBurnedSupply,
        onlineWeight
    ).catch((err) => Promise.reject(LOG_ERR('getQuorumPromise.calcOnlineOfflineRepWeights', err)));

    return {
        noRepPercent,
        noRepWeight,
        nonBurnedWeight: nonBurnedSupply,
        offlinePercent,
        offlineWeight,
        onlinePercent,
        onlineWeight,
        onlineWeightMinimum,
        onlineWeightQuorumPercent,
        peersStakeWeight,
        quorumDelta,
    };
};

/** Returns statistics about weight required to confirm transactions, online staking weight, etc. */
export const getQuorum = (res): void => {
    getQuorumPromise()
        .then((data) => res.send(data))
        .catch((err) => res.status(500).send(err));
};
