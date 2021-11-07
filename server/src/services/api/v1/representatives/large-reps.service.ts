import {LargeRepresentativeDto, RepresentativeDto} from '@app/types';
import {NANO_CLIENT} from '@app/config';
import {LOG_INFO} from '@app/services';
import {rawToBan} from 'banano-unit-converter';
import {populateDelegatorsCount} from "./rep-utils";

const DEFAULT_MIN_WEIGHT = 100000;
const DEFAULT_INCLUDE_DELEGATORS_COUNT = false;

/**
 * Gets the top 5000 representatives & filters out smaller ones.
 */
export const getLargeReps = async (req, res): Promise<LargeRepresentativeDto[]> => {
    const start = LOG_INFO('Refreshing Large Reps');

    const minWeightToBeCounted = Number(req.query.minWeight || DEFAULT_MIN_WEIGHT);
    let includeDelegatorsCount: boolean = req.body.delegatorCount;
    if (includeDelegatorsCount === undefined) {
        includeDelegatorsCount = DEFAULT_INCLUDE_DELEGATORS_COUNT;
    }

    const rpcData = await NANO_CLIENT.representatives(5000, true);
    const largeRepMap = new Map<string, Partial<RepresentativeDto>>();

    // Add all reps with high-enough weight to a map.
    for (const address in rpcData.representatives) {
        const raw = rpcData.representatives[address];
        const weight = Math.round(Number(rawToBan(raw)));
        if (weight >= minWeightToBeCounted) {
            largeRepMap.set(address, { weight });
        } else {
            break;
        }
    }

    // Adds delegatorsCount to each weightedRep.
    if (includeDelegatorsCount) {
        await populateDelegatorsCount(largeRepMap);
    }

    // Construct large rep response-types dto
    const largeReps: LargeRepresentativeDto[] = [];
    for (const address of largeRepMap.keys()) {
        const rep = largeRepMap.get(address);
        largeReps.push({
            address,
            weight: rep.weight,
            delegatorsCount: rep.delegatorsCount,
        });
    }

    res.send(largeReps);
    LOG_INFO('Large Reps Updated', start);
    return largeReps;
};
