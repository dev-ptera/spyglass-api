import {LargeRepresentativeDto, RepresentativeDto} from '@app/types';
import {NANO_CLIENT} from '@app/config';
import {LOG_INFO} from '@app/services';
import {rawToBan} from 'banano-unit-converter';

const DEFAULT_MIN_WEIGHT = 100000;

/**
 * Gets the top 5000 representatives & filters out smaller ones.
 */
export const getLargeReps = async (req, res): Promise<LargeRepresentativeDto[]> => {
    const start = LOG_INFO('Refreshing Large Reps');
    const minWeightToBeCounted = Number(req.query.minWeight || DEFAULT_MIN_WEIGHT);

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

    // Construct large rep response dto
    const largeReps: LargeRepresentativeDto[] = [];
    for (const address of largeRepMap.keys()) {
        const rep = largeRepMap.get(address);
        largeReps.push({
            address,
            weight: rep.weight
        });
    }

    res.send(largeReps);
    LOG_INFO('Large Reps Updated', start);
    return largeReps;
};
