import { QuorumDto } from '@app/types';
import { NANO_CLIENT } from '@app/config';
import { convertFromRaw, LOG_ERR } from '@app/services';

export const getQuorumPromise = async (): Promise<QuorumDto> => {
    const rawQuorum = await NANO_CLIENT.confirmation_quorum().catch((err) => Promise.reject(err));

    return Promise.all([
        convertFromRaw(rawQuorum.quorum_delta),
        convertFromRaw(rawQuorum.online_weight_minimum),
        convertFromRaw(rawQuorum.online_stake_total),
        convertFromRaw(rawQuorum.peers_stake_total),
    ])
        .then((conversions: number[]) => {
            return Promise.resolve({
                onlineWeightQuorumPercent: Number(rawQuorum.online_weight_quorum_percent),
                quorumDelta: Number(conversions[0]),
                onlineWeightMinimum: Number(conversions[1]),
                onlineStakeTotal: Number(conversions[2]),
                peersStakeTotal: Number(conversions[3]),
            });
        })
        .catch((err) => Promise.reject(err));
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
