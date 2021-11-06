import * as RPC from '@dev-ptera/nano-node-rpc';
import { AppCache, NANO_CLIENT } from '@app/config';

import { rawToBan } from 'banano-unit-converter';
import { BasicRepDetails } from '@app/types';
import { LOG_ERR } from '@app/services';

const MIN_WEIGHT_TO_BE_COUNTED = 1000;

/**
 * Filters out reps with a lower balance, adds flag if rep is online.
 */
const processNodeResponse = async (data: RPC.RepresentativesResponse): Promise<BasicRepDetails[]> => {
    const weightedReps = new Map<string, { weight: number; online: boolean }>();
    const reps: BasicRepDetails[] = [];

    // Add all reps with high-enough delegated weight to a map.
    for (const address in data.representatives) {
        const raw = data.representatives[address];
        const weight = Math.round(Number(rawToBan(raw)));

        if (weight >= MIN_WEIGHT_TO_BE_COUNTED) {
            weightedReps.set(address, { weight, online: false });
        } else {
            break;
        }
    }

    // Get all online reps from nano rpc (includes non-tracked reps) & mark included weighted reps as online.
    // TODO: Use the representatives_online Promise call from the representatives folder.
    const onlineReps = (await NANO_CLIENT.representatives_online().catch((err) =>
        Promise.reject(LOG_ERR('getAllReps.representatives_online', err))
    )) as RPC.RepresentativesOnlineResponse;
    for (const address of onlineReps.representatives) {
        const weightedRep = weightedReps.get(address);
        if (weightedRep) {
            weightedRep.online = true;
        }
    }

    // Mark reps as online using AppCache.  Network stats must respect AppCache online status.
    for (const trackedRep of AppCache.representatives.thresholdReps) {
        if (trackedRep.online) {
            const weightedRep = weightedReps.get(trackedRep.address);
            if (weightedRep) {
                weightedRep.online = true;
            }
        }
    }

    // Construct response array
    for (const address of weightedReps.keys()) {
        reps.push({
            address,
            votingWeight: weightedReps.get(address).weight,
            online: weightedReps.get(address).online,
        });
    }
    return reps;
};

/** Gets a large amount of representatives so we can aggregate online voting weight stats. */
export const getAllReps = (): Promise<BasicRepDetails[]> =>
    NANO_CLIENT.representatives(5000, true)
        .then(processNodeResponse)
        .then((reps) => Promise.resolve(reps))
        .catch((err) => Promise.reject(err));
