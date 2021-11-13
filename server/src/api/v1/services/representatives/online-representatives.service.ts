import { NANO_CLIENT} from '@app/config';
import {ConfirmationQuorumResponse} from '@dev-ptera/nano-node-rpc';
import {rawToBan} from 'banano-unit-converter';
import {LOG_ERR, LOG_INFO} from "@app/util";

/** Get online voting weight (BAN) */
export const getOnlineWeight = (): Promise<number> =>
    NANO_CLIENT.confirmation_quorum()
        .then((quorumResponse: ConfirmationQuorumResponse) =>
            Promise.resolve(Number(rawToBan(quorumResponse.online_stake_total)))
        )
        .catch((err) => Promise.reject(LOG_ERR('cacheRepresentatives.getOnlineWeight', err)));

export const getOnlineRepsPromise = async (): Promise<string[]> => {
    const rpcData = await NANO_CLIENT.representatives_online(false);
    const response: string[] = [];
    for (const rep of rpcData.representatives as string[]) {
        response.push(rep);
    }
    return response;
};

/** Returns a string array of online representative addresses. */
export const getOnlineReps = async (req, res): Promise<string[]> => {
    const start = LOG_INFO('Updating Online Reps');
    const response = await getOnlineRepsPromise();
    res.send(response);
    LOG_INFO('Online Reps Updated', start);
    return response;
};
