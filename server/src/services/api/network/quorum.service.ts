import { QuorumDto } from '@app/types';
import { NANO_CLIENT } from '@app/config';
import { convertFromRaw, getOfflineRepresentativesPromise, getSupplyPromise, LOG_ERR } from '@app/services';

const calcOnlineOfflineRepWeights = async (nonBurned: number, onlineWeight: number): Promise<Partial<QuorumDto>> => {
    const offlineReps = await getOfflineRepresentativesPromise().catch((err) => Promise.reject(err));
    let offlineWeight = 0;
    offlineReps.map((rep) => (offlineWeight += rep.weight));
    const noRepWeight = nonBurned - onlineWeight - offlineWeight;
    return {
        noRepWeight,
        noRepPercent: noRepWeight / nonBurned,
        offlineWeight,
        offlinePercent: offlineWeight / nonBurned,
        onlineWeight,
        onlinePercent: onlineWeight / nonBurned,
    };
};

export const getQuorumPromise = async (): Promise<QuorumDto> => {
    const rawQuorum = await NANO_CLIENT.confirmation_quorum().catch((err) => Promise.reject(err));
    const supply = await getSupplyPromise();
    const onlineWeightQuorumPercent = Number(rawQuorum.online_weight_quorum_percent);
    const quorumDelta = convertFromRaw(rawQuorum.quorum_delta);
    const onlineWeightMinimum = convertFromRaw(rawQuorum.online_weight_minimum);
    const onlineWeight = convertFromRaw(rawQuorum.online_stake_total);
    const peersStakeWeight = convertFromRaw(rawQuorum.peers_stake_total);
    const nonBurnedWeight = supply.totalAmount - supply.burnedAmount;
    const onlineOfflineRepWeights = await calcOnlineOfflineRepWeights(nonBurnedWeight, onlineWeight);

    return {
        noRepPercent: onlineOfflineRepWeights.noRepPercent,
        noRepWeight: onlineOfflineRepWeights.noRepWeight,
        nonBurnedWeight,
        offlinePercent: onlineOfflineRepWeights.offlinePercent,
        offlineWeight: onlineOfflineRepWeights.offlineWeight,
        onlinePercent: onlineOfflineRepWeights.onlinePercent,
        onlineWeight: onlineOfflineRepWeights.onlineWeight,
        onlineWeightMinimum,
        onlineWeightQuorumPercent,
        peersStakeWeight,
        quorumDelta,
    };
};

/** Returns statistics about weight required to confirm transactions, online staking weight, etc. */
export const getQuorum = (req, res): void => {
    getQuorumPromise()
        .then((quorumData: QuorumDto) => {
            res.send(quorumData);
        })
        .catch((err) => {
            res.status(500).send(LOG_ERR('getQuorum', err));
        });
};
