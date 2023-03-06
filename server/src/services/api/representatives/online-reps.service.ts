import { AppCache, BACKUP_NODES, NANO_CLIENT } from '@app/config';
import { getRepresentativesPromise, LOG_ERR, LOG_INFO } from '@app/services';
import * as RPC from '@dev-ptera/nano-node-rpc';
import axios, { AxiosResponse } from 'axios';
import { representativesOnlineWithoutWeightRpc} from "@app/rpc";

/** Number of a pings a representative has be omitted from the `representatives_online` rpc command list to be considered offline. */
const OFFLINE_AFTER_PINGS = 5;

const logResponseError = (url: string, err: any): Promise<RPC.RepresentativesOnlineResponse> => {
    LOG_ERR('getOnlineRepsFromExternalApi', err, { url });
    return Promise.resolve({
        representatives: [],
    });
};

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
            if (response && response.data && !response.data.representatives) {
                return logResponseError(url, response.data);
            }
            if (!response || !response.data || !response.data.representatives) {
                return logResponseError(url, response);
            }
            return Promise.resolve(response.data);
        })
        .catch((err) => logResponseError(url, err));

export const getOnlineRepsPromise = async (): Promise<string[]> => {
    const offlinePingsMap = AppCache.offlinePingsMap;
    const onlineReps: Set<string> = new Set();
    const externalCalls: Promise<RPC.RepresentativesOnlineResponse>[] = [];

    BACKUP_NODES.map((external) => externalCalls.push(getOnlineRepsFromExternalApi(external)));

    // Iterate through the results, add all unique reps to a set.
    await Promise.all(
        [representativesOnlineWithoutWeightRpc(),
        ...externalCalls]).then(
        (rpcResponses: Array<RPC.RepresentativesOnlineResponse>) => {
            for (const response of rpcResponses) {
                response.representatives.map((rep) => {
                    onlineReps.add(rep);
                    offlinePingsMap.set(rep, 0);
                });
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

/** Use this method to update the list of `onlineRepresentatives` and `onlineRepresentativesWithWeights` in the AppCache.
    Note: The `monitored-reps.service` can also mark representatives as online. Non-PRs do not appear
    in the list via RPC commands, so the monitored service marks monitored small reps as online.
 */
export const cacheOnlineRepresentatives = async (): Promise<void> => {
    const start = LOG_INFO('Updating Online Reps');
    const onlineReps = await getOnlineRepsPromise();
    LOG_INFO('Online Reps Updated', start);
    AppCache.onlineRepresentatives = onlineReps;
    const onlineRepsWithWeights = await getRepresentativesPromise({
        addresses: AppCache.onlineRepresentatives,
    });
    AppCache.onlineRepresentativesWithWeights = onlineRepsWithWeights;
};
