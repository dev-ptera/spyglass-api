import { AppCache, BACKUP_NODES, NANO_CLIENT } from '@app/config';
import { getPRWeight, getPRWeightPromise, LOG_ERR, LOG_INFO } from '@app/services';
import * as RPC from '@dev-ptera/nano-node-rpc';
import axios, { AxiosResponse } from 'axios';

/** Number of a pings a representative has be omitted from the `representatives_online` rpc command list to be considered offline. */
const OFFLINE_AFTER_PINGS = 5;

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

export const getOnlineRepsPromise = async (): Promise<string[]> => {
    const offlinePingsMap = AppCache.offlinePingsMap;
    const onlineReps: Set<string> = new Set();
    const externalCalls: Promise<RPC.RepresentativesOnlineResponse>[] = [];
    BACKUP_NODES.map((external) => externalCalls.push(getOnlineRepsFromExternalApi(external)));

    // Iterate through the results, add all unique reps to a set.
    await Promise.all([NANO_CLIENT.representatives_online(false), ...externalCalls]).then(
        (rpcResponses: Array<RPC.RepresentativesOnlineResponse>) => {
            for (const response of rpcResponses) {
                if (response && response.representatives) {
                    response.representatives.map((rep) => {
                        onlineReps.add(rep);
                        offlinePingsMap.set(rep, 0);
                    });
                } else {
                    LOG_ERR('getOnlineRepsPromise', {
                        error: `Malformed response for representatives_online RPC: ${JSON.stringify(response || '')}`,
                    });
                }
            }
        }
    );

    // Increment offline pings for representatives not found in the last series of RPC calls.
    for (const addr of offlinePingsMap.keys()) {
        if (!onlineReps.has(addr)) {
            const newPingCount = offlinePingsMap.get(addr) + 1;
            offlinePingsMap.set(addr, newPingCount);
        }
    }

    // Add any reps from the offlinePingsMap that do not exceed OFFLINE_AFTER_PINGS.
    for (const addr of offlinePingsMap.keys()) {
        if (offlinePingsMap.get(addr) < OFFLINE_AFTER_PINGS) {
            onlineReps.add(addr);
        }
    }
    return Array.from(onlineReps.values());
};

/** Returns a string array of online-reps representative addresses. */
export const cacheOnlineRepresentatives = async (): Promise<void> => {
    const start = LOG_INFO('Updating Online Reps');
    const onlineReps = await getOnlineRepsPromise();
    LOG_INFO('Online Reps Updated', start);
    AppCache.onlineRepresentatives = onlineReps;
};
