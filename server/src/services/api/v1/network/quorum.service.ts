import { ConfirmationQuorumResponse } from '@dev-ptera/nano-node-rpc';
import { QuorumDto } from '@app/types';
import { NANO_CLIENT } from '@app/config';
import { convertToBan, LOG_ERR } from '@app/services';

export const getQuorumPromise = async (): Promise<QuorumDto> => {
    let rawQuorum: ConfirmationQuorumResponse;
    await NANO_CLIENT.confirmation_quorum()
        .then((quorumResponse: ConfirmationQuorumResponse) => {
            rawQuorum = quorumResponse;
        })
        .catch((err) => Promise.reject(err));

    return Promise.all([
        convertToBan(rawQuorum.quorum_delta),
        convertToBan(rawQuorum.online_weight_minimum),
        convertToBan(rawQuorum.online_stake_total),
        convertToBan(rawQuorum.peers_stake_total),
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

/** Returns statistics about amount of BAN required to confirm transactions, online staking weight, etc. */
export const getQuorum = (req, res): void => {
    getQuorumPromise()
        .then((quorumData: QuorumDto) => {
            res.send(quorumData);
        })
        .catch((err) => {
            res.status(500).send(LOG_ERR('getQuorum', err));
        });
};
