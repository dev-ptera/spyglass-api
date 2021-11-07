import { AppCache, BACKUP_NODES, NANO_CLIENT } from '@app/config';
import * as RPC from '@dev-ptera/nano-node-rpc';
import axios, { AxiosResponse } from 'axios';
import { LOG_ERR } from '../../../log/error.service';
import { LOG_INFO } from '../../../log/info.service';
import { ConfirmationQuorumResponse } from '@dev-ptera/nano-node-rpc';
import { rawToBan } from 'banano-unit-converter';

const OFFLINE_AFTER_PINGS = 2;

/** Given an address, marks the representative as online in the AppCache. */
export const markRepAsOnline = (address: string, writeToOnlineRepsList: boolean = false): void => {
    AppCache.repPings.map.set(address, AppCache.repPings.currPing);
    if (writeToOnlineRepsList && !AppCache.representatives.onlineReps.includes(address)) {
        AppCache.representatives.onlineReps.push(address);
    }
};

/**
 * The `representatives_online` RPC call is unreliable, so I mark reps as offline if they have been offline for OFFLINE_AFTER_PINGS pings.
 */
export const isRepOnline = (repAddress: string): boolean =>
    AppCache.repPings.map.get(repAddress) !== undefined &&
    AppCache.repPings.map.get(repAddress) !== 0 &&
    AppCache.repPings.map.get(repAddress) + OFFLINE_AFTER_PINGS >= AppCache.repPings.currPing;

/** Uses BACKUP_NODES to make additional rpc calls. */
const getOnlineRepsFromExternalApi = (url: string): Promise<RPC.RepresentativesOnlineResponse> =>
    axios
        .request<RPC.RepresentativesOnlineResponse>({
            method: 'post',
            timeout: 10000,
            url,
            data: {
                action: 'representatives_online',
            },
        })
        .then((response: AxiosResponse<RPC.RepresentativesOnlineResponse>) => {
            return Promise.resolve(response.data);
        })
        .catch((err) => {
            LOG_ERR('getOnlineRepsFromExternalApi', err);
            return Promise.resolve({
                representatives: [],
            });
        });

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
