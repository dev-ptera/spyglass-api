import { BACKUP_NODES, NANO_CLIENT } from '@app/config';
import { LOG_ERR, LOG_INFO } from '@app/services';
import * as RPC from '@dev-ptera/nano-node-rpc';
import axios, { AxiosResponse } from 'axios';

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
    const onlineReps: Set<string> = new Set();
    const externalCalls: Promise<RPC.RepresentativesOnlineResponse>[] = [];
    BACKUP_NODES.map((external) => externalCalls.push(getOnlineRepsFromExternalApi(external)));

    // Iterate through the results, add all unique reps to a set.
    await Promise.all([NANO_CLIENT.representatives_online(false), ...externalCalls]).then(
        (rpcResponses: Array<RPC.RepresentativesOnlineResponse>) => {
            for (const response of rpcResponses) {
                if (response && response.representatives) {
                    response.representatives.map((rep) => onlineReps.add(rep));
                } else {
                    LOG_ERR('getOnlineRepsPromise', {
                        error: `Malformed response for representatives_online RPC: ${JSON.stringify(response || '')}`,
                    });
                }
            }
        }
    );

    return Array.from(onlineReps.values());
};

/** Returns a string array of online-reps.3 representative addresses. */
export const getOnlineReps = async (req, res): Promise<string[]> => {
    const start = LOG_INFO('Updating Online Reps');
    const response = await getOnlineRepsPromise();
    res.send(response);
    LOG_INFO('Online Reps Updated', start);
    return response;
};
