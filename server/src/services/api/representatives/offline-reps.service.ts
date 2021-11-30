import {convertFromRaw} from '@app/services';
import {AppCache, NANO_CLIENT} from "@app/config";

type SimpleRep = { address: string, weight: number };

/** Returns a list of representatives that are offline. */
export const getOfflineRepresentativesPromise = async (): Promise<SimpleRep[]> => {
    const rpcData = await NANO_CLIENT.representatives(15000, true);
    const allReps: { address: string, weight: number }[] = [];
    for (const address in rpcData.representatives) {
        const weight = convertFromRaw(rpcData.representatives[address]);
        allReps.push({address, weight});
    }
    const onlineSet = new Set(AppCache.onlineRepresentatives);
    const offlineRepMap = new Map<string, SimpleRep>();
    allReps.map((rep) => {
        if (!onlineSet.has(rep.address)) {
            offlineRepMap.set(rep.address, rep);
        }
    });
    return Array.from(offlineRepMap.values());
};
