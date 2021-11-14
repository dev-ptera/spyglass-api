import { NANO_CLIENT } from '@app/config';
import { rawToBan } from 'banano-unit-converter';
import {LOG_INFO} from "@app/util";
import {LargeRepresentativeDto, populateDelegatorsCount } from "@app/api";
import * as LargeRepresentativesConfig from './config';

type RequestBody = LargeRepresentativesConfig.RequestBody;
const DEFAULT_BODY = LargeRepresentativesConfig.DEFAULT_BODY;

export const getLargeRepsPromise = async (
    params: RequestBody
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
    const body = req.body as RequestBody;
    if (body.maximumWeight === undefined) {
        body.maximumWeight = DEFAULT_BODY.maximumWeight
    }
    if (body.minimumWeight === undefined) {
        body.minimumWeight = DEFAULT_BODY.minimumWeight;
    }
    body.minimumWeight = Math.max(body.minimumWeight, 1000);
    if (body.includeDelegatorCount === undefined) {
        body.includeDelegatorCount = DEFAULT_BODY.includeDelegatorCount;
    }
    const largeReps = await getLargeRepsPromise(body);
    res.send(largeReps);
    LOG_INFO('Large Reps Updated', start);
    return largeReps;
};
