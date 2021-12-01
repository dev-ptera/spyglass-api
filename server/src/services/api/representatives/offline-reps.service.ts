import {convertFromRaw, LOG_ERR} from '@app/services';
import { AppCache, NANO_CLIENT } from '@app/config';

type SimpleRep = { address: string; weight: number };

/** Returns a very large list of representatives that are offline (with weight). */
export const getOfflineRepresentativesPromise = async (): Promise<SimpleRep[]> => {

    const allReps: SimpleRep[] = [];
    const offlineReps: SimpleRep[] = [];
    const rpcData = await NANO_CLIENT.representatives(15000, true)
        .catch((err) => Promise.reject(LOG_ERR('getOfflineRepresentativesPromise', err)));

    // Fetches a large amount of representatives & adds results to a list.
    // Do not include representatives with a 0 weight balance.
    for (const address in rpcData.representatives) {
        const weight = convertFromRaw(rpcData.representatives[address]);
        if (weight === 0) {
            break;
        }
        allReps.push({ address, weight });
    }

    // Iterate through the list of all representatives.  If offline, add rep to the offline rep list.
    const onlineSet = new Set(AppCache.onlineRepresentatives);
    allReps.map((rep) => {
        if (!onlineSet.has(rep.address)) {
            offlineReps.push({ address: rep.address, weight: rep.weight });
        }
    });
    return offlineReps;
};
