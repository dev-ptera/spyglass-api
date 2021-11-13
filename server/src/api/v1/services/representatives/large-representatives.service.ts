import { NANO_CLIENT } from '@app/config';
import { rawToBan } from 'banano-unit-converter';
import { populateDelegatorsCount } from './representatives-utils';
import {LargeRepresentativeDto} from "@app/api";
import {LOG_INFO} from "@app/util";

/* Defaults */
const DEFAULT_MIN_WEIGHT = 100000;
const DEFAULT_INCLUDE_DELEGATORS_COUNT = false;

/* API Restrictions */
const MINIMUM_MIN_WEIGHT = 1000;


type LargeRepresentativesBodyParameter = {
    minimumWeight: number;
    maximumWeight: number;
    includeDelegatorCount: boolean;
};

export const getLargeRepsPromise = async (
    params: LargeRepresentativesBodyParameter
): Promise<LargeRepresentativeDto[]> => {

    // Representative data is returned with weight descending.
    const rpcData = await NANO_CLIENT.representatives(5000, true);
    const largeRepMap = new Map<string, Partial<LargeRepresentativeDto>>();

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
    const largeReps: LargeRepresentativeDto[] = [];
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
export const getLargeReps = async (req, res): Promise<LargeRepresentativeDto[]> => {
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
