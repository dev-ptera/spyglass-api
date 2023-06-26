import { cacheSend, getQuorumPromise } from '@app/services';
import { AppCache, NAKAMOTO_COEFFICIENT_CACHE_PAIR, QUORUM_CACHE_PAIR } from '@app/config';
import { BasicRep, NakamotoCoefficientDto } from '@app/types';

export const countRepsRequiredToOverflowBanAmount = (
    delta: number
): {
    repsRequiredNumber: number;
    representatives: BasicRep[];
    repsWeightSum: number;
} => {
    let ncRepsWeight = 0;
    let nakamotoCoefficient = 0;
    const ncRepresentatives: BasicRep[] = [];

    // Iterate through the list of online reps & aggregate their weights until it exceeds the delta.
    // The number of representatives required to match or surpass the delta is the nakamoto coefficient.
    for (const rep of AppCache.onlineRepresentativesWithWeights) {
        nakamotoCoefficient++;
        ncRepsWeight += rep.weight;
        ncRepresentatives.push(rep);
        if (ncRepsWeight >= delta) {
            break;
        }
    }

    return {
        repsRequiredNumber: nakamotoCoefficient,
        representatives: ncRepresentatives,
        repsWeightSum: ncRepsWeight,
    };
};

/** Calculates nakamoto coefficient. */
const calcNakamotoCoefficientPromise = async (): Promise<NakamotoCoefficientDto> => {
    // Use a cached delta value if it's available, otherwise call the Quorum service.
    let delta: number;
    if (AppCache.temp.has(QUORUM_CACHE_PAIR.key)) {
        delta = AppCache.temp.get(QUORUM_CACHE_PAIR.key).quorumDelta;
    } else {
        const quorum = await getQuorumPromise().catch(Promise.reject);
        delta = quorum.quorumDelta;
    }

    const { repsRequiredNumber, representatives, repsWeightSum } = countRepsRequiredToOverflowBanAmount(delta);

    return {
        delta,
        nakamotoCoefficient: repsRequiredNumber,
        ncRepresentatives: representatives,
        ncRepsWeight: repsWeightSum,
    };
};

/** The Nakamoto coefficient represents the minimum number of entities to compromise a given subsystem.
 *  In this context, it represents the number of representatives that must collude together to achieve consensus. */
export const getNakamotoCoefficientV1 = (res): void => {
    calcNakamotoCoefficientPromise()
        .then((nc) => cacheSend(res, nc, NAKAMOTO_COEFFICIENT_CACHE_PAIR))
        .catch((err) => res.status(500).send(err));
};
