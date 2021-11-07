import {RepresentativeLargeDto} from '@app/types';
import {NANO_CLIENT} from '@app/config';
import {defineBodyParams, LOG_INFO} from '@app/services';
import {rawToBan} from 'banano-unit-converter';
import {populateDelegatorsCount} from "./rep-utils";

const DEFAULT_MIN_WEIGHT = 100000;
const MINIMUM_MIN_WEIGHT = 1000;
const DEFAULT_INCLUDE_DELEGATORS_COUNT = false;

/**
 * Gets the top 5000 representatives & filters out smaller ones.
 */
export const getRepresentatives = async (req, res): Promise<RepresentativeLargeDto[]> => {
    const start = LOG_INFO('Refreshing Large Reps');

    const BODY_PARAMS = defineBodyParams([
        'includeDelegatorCount',
        'includeNodeMonitorStats',
        'includeUptimeStats',
        'isOnline',
        'isPrincipal',
        'minimumWeight',
        'maximumWeight'
    ]);


    // minimumWeight
    let minWeightToBeCounted = Number(req.body[BODY_PARAMS.minimumWeight] || DEFAULT_MIN_WEIGHT);
    minWeightToBeCounted = Math.max(MINIMUM_MIN_WEIGHT, minWeightToBeCounted);

    // maximumWeight
    const maxWeightToBeCounted = Number(req.body[BODY_PARAMS.maximumWeight]);

    // includeDelegatorsCount
    let includeDelegatorCount: boolean = req.body[BODY_PARAMS.includeDelegatorCount];
    if (includeDelegatorCount === undefined) {
        includeDelegatorCount = DEFAULT_INCLUDE_DELEGATORS_COUNT;
    }

    // includeMonitorStats
    let includeMonitorStats: boolean = req.body[BODY_PARAMS.includeMonitorStats];

    // includeUptimeStats
    let includeUptimeStats: boolean = req.body[BODY_PARAMS.includeUptimeStats];

    // isOnline
    let isOnline: boolean = req.body[BODY_PARAMS.isOnline];

    // isPrincipal
    let isPrincipal: boolean = req.body[BODY_PARAMS.isPrincipal];

    console.log(maxWeightToBeCounted);
    console.log(minWeightToBeCounted);
    console.log(includeMonitorStats);
    console.log(includeUptimeStats);
    console.log(isPrincipal);
    console.log(isOnline);
    console.log(isPrincipal);

    const rpcData = await NANO_CLIENT.representatives(5000, true);
    const largeRepMap = new Map<string, Partial<RepresentativeLargeDto>>();

    // Add all reps with high-enough weight to a map.
    for (const address in rpcData.representatives) {
        const raw = rpcData.representatives[address];
        const weight = Math.round(Number(rawToBan(raw)));
        if (maxWeightToBeCounted > 0 && weight <= maxWeightToBeCounted) {
            largeRepMap.set(address, { weight });
        }
        if (weight >= minWeightToBeCounted) {
            largeRepMap.set(address, { weight });
        } else {
            break;
        }
    }

    // Adds delegatorsCount to each weightedRep.
    if (includeDelegatorCount) {
        await populateDelegatorsCount(largeRepMap);
    }

    // Construct large rep response-types dto
    const largeReps: RepresentativeLargeDto[] = [];
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
