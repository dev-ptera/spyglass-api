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

/** Makes a handful of async calls to various nodes & fetches a string array of online representatives.
 *  Responsible for populating the AppCache repPings object.  */
export const getOnlineRepsPromise = (): Promise<string[]> => {
    const start = LOG_INFO('Updating Online Reps');

    // Uses BACKUP_NODES public apis for getting a more complete list of online representatives.
    // May not be applicable anymore in V22.
    const externalCalls: Promise<any>[] = [];
    for (const api of BACKUP_NODES) {
        externalCalls.push(getOnlineRepsFromExternalApi(api));
    }

    return new Promise((resolve) => {
        const currentPingOnlineReps = new Set<string>();

        Promise.all([NANO_CLIENT.representatives_online(false), ...externalCalls])
            .then((data: Array<RPC.RepresentativesOnlineResponse>) => {
                // Update online pings
                AppCache.repPings.currPing++;
                console.log(AppCache.repPings.currPing);

                // Iterate through the results, add all unique reps to a set.
                for (const resultSet of data) {
                    if (resultSet && resultSet.representatives) {
                        resultSet.representatives.map((rep) => currentPingOnlineReps.add(rep));
                    } else {
                        LOG_ERR('getOnlineRepsPromise', {
                            error: `Malformed response for representatives_online RPC: ${JSON.stringify(
                                resultSet || ''
                            )}`,
                        });
                    }
                }

                // The following representatives get to increase their last-known ping since they were included in representatives_online result.
                for (const address of Array.from(currentPingOnlineReps)) {
                    markRepAsOnline(address);
                }

                // Use the pings to update the AppCache online reps.
                const onlineReps = new Set<string>();
                for (const rep of AppCache.repPings.map.keys()) {
                    if (isRepOnline(rep)) {
                        onlineReps.add(rep);
                    }
                }

                LOG_INFO('Online Reps Updated', start);
                resolve(Array.from(onlineReps));
            })
            .catch((err) => {
                LOG_ERR('getOnlineRepsPromise', err);
                resolve([]);
            });
    });
};

/** Get online voting weight (BAN) */
export const getOnlineWeight = (): Promise<number> =>
    NANO_CLIENT.confirmation_quorum()
        .then((quorumResponse: ConfirmationQuorumResponse) =>
            Promise.resolve(Number(rawToBan(quorumResponse.online_stake_total)))
        )
        .catch((err) => Promise.reject(LOG_ERR('cacheRepresentatives.getOnlineWeight', err)));

/** Returns the list of online representatives from AppCache. */
export const getOnlineReps = (req, res): void => {
    res.send(AppCache.representatives.onlineReps);
};
