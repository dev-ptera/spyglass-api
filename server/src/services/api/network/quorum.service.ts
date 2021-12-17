import { QuorumDto, SupplyDto } from '@app/types';
import { AppCache, NANO_CLIENT, QUORUM_CACHE_KEY } from '@app/config';
import {
    cacheSend,
    convertFromRaw,
    getOfflineRepresentativesPromise,
    getRepresentativesPromise,
    getSupplyPromise,
    LOG_ERR,
    secondsToMs,
} from '@app/services';
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

/** Instead of using direct RPC commands to gather the online weight, I calculate the onlineWeight using reps from the AppCache.
 *  These numbers are not realtime, since representatives are not immediately marked as being offline.
 *
 *  Originally I was using the RPC commands here for onlineWeight, but then there would be an inconsistency between data returned by my own services;
 *  The online reps service would potentially mark reps online, whose weight was not included in the quorum's onlineWeight response.
 *
 *  I cannot mix & match data sources for this metric, so I will use my own service's perception of what representatives are online or offline.
 * */
const calculateOnlineWeight = async (deltaPercentage: number) => {
    const onlineReps = await getRepresentativesPromise({ addresses: AppCache.onlineRepresentatives });
    let onlineWeight = 0;
    onlineReps.map((rep) => (onlineWeight += rep.weight));
    const quorumDelta = Number(onlineWeight * deltaPercentage);
    return {
        onlineWeight,
        quorumDelta,
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
    const { peersStakeWeight, onlineWeightQuorumPercent, onlineWeightMinimum } = await NANO_CLIENT.confirmation_quorum()
        .then(convertRaw)
        .catch((err) => Promise.reject(LOG_ERR('getQuorumPromise.confirmation_quorum', err)));

    const { onlineWeight, quorumDelta } = await calculateOnlineWeight(onlineWeightQuorumPercent).catch((err) =>
        Promise.reject(LOG_ERR('getQuorumPromise.calculateOnlineWeight', err))
    );

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

/** Returns *estimated* statistics around network weight required to confirm transactions.
 *  Statistics are not real-time nor 100% accurate since `onlineWeight` is calculated
 *  using online representatives provided via the `online-representatives` service.
 * */
export const getQuorum = (res): void => {
    getQuorumPromise()
        .then((data) => cacheSend(res, data, QUORUM_CACHE_KEY, secondsToMs(10)))
        .catch((err) => res.status(500).send(err));
};
