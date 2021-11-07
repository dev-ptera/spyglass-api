import { RepresentativeLargeDto } from '@app/types';
import { NANO_CLIENT } from '@app/config';
import { LOG_INFO } from '@app/services';
import { rawToBan } from 'banano-unit-converter';
import { populateDelegatorsCount } from './representatives-utils';

const DEFAULT_MIN_WEIGHT = 100000;
const MINIMUM_MIN_WEIGHT = 1000;
const DEFAULT_INCLUDE_DELEGATORS_COUNT = false;

type LargeRepresentativesBodyParameter = {
    minimumWeight: number;
    maximumWeight: number;
    includeDelegatorCount: boolean;
};

export const getLargeRepsPromise = async (
    params: LargeRepresentativesBodyParameter
): Promise<RepresentativeLargeDto[]> => {
    // Representative data is returned with weight descending.
    const rpcData = await NANO_CLIENT.representatives(5000, true);
    const largeRepMap = new Map<string, Partial<RepresentativeLargeDto>>();

    // Add all reps with high-enough weight to a map.
    for (const address in rpcData.representatives) {
        const raw = rpcData.representatives[address];
        const weight = Math.round(Number(rawToBan(raw)));
        if (params.maximumWeight) {
            if (weight <= params.maximumWeight && weight >= params.minimumWeight) {
                largeRepMap.set(address, { weight });
            } else {
                continue;
            }
        } else if (weight >= params.minimumWeight) {
            largeRepMap.set(address, { weight });
        } else {
            break;
        }
    }

    // Adds delegatorsCount to each weightedRep.
    if (params.includeDelegatorCount) {
        await populateDelegatorsCount(largeRepMap);
    }

    // Construct large rep response-types DTO
    const largeReps: RepresentativeLargeDto[] = [];
    for (const address of largeRepMap.keys()) {
        const rep = largeRepMap.get(address);
        largeReps.push({
            address,
            weight: rep.weight,
            delegatorsCount: rep.delegatorsCount,
        });
    }
    return largeReps;
};

/**
 * Gets the top 5000 representatives & filters out smaller ones.
 */
export const getLargeReps = async (req, res): Promise<RepresentativeLargeDto[]> => {
    const start = LOG_INFO('Refreshing Large Reps');
    const body = req.body as LargeRepresentativesBodyParameter;

    // minimumWeight
    let minimumWeight = Number(body.minimumWeight || DEFAULT_MIN_WEIGHT);
    minimumWeight = Math.max(MINIMUM_MIN_WEIGHT, minimumWeight);

    // maximumWeight
    let maximumWeight = Number(body.maximumWeight || undefined);

    // delegators
    let includeDelegatorCount: boolean = body.includeDelegatorCount;
    if (includeDelegatorCount === undefined) {
        includeDelegatorCount = DEFAULT_INCLUDE_DELEGATORS_COUNT;
    }

    const largeReps = await getLargeRepsPromise({
        includeDelegatorCount,
        minimumWeight,
        maximumWeight,
    });

    res.send(largeReps);
    LOG_INFO('Large Reps Updated', start);
    return largeReps;
};
