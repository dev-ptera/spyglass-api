import {cacheSend, convertFromRaw, getQuorumPromise, LOG_ERR} from '@app/services';
import {AppCache, DELTA_CACHE_PAIR, NAKAMOTO_COEFFICIENT_CACHE_PAIR, NANO_CLIENT} from '@app/config';
import { NakamotoCoefficientDto } from '@app/types';

/** Calculates nakamoto coefficient. */
const calcNakamotoCoefficientPromise = async (): Promise<NakamotoCoefficientDto> => {

    // Use a cached delta value if it's available, otherwise call the Quorum service.
    let delta = 0;
    if (AppCache.temp.get(DELTA_CACHE_PAIR.key)) {
        delta = AppCache.temp.get(DELTA_CACHE_PAIR.key);
    } else {
        const quorum = await getQuorumPromise()
            .catch((err) => Promise.reject(LOG_ERR('calcNakamotoCoefficientPromise.confirmation_quorum', err)));
        delta = quorum.quorumDelta;
    }

    let ncRepsWeight = 0;
    let nakamotoCoefficient = 0;
    const ncRepresentatives = [];

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
        delta,
        nakamotoCoefficient,
        ncRepresentatives,
        ncRepsWeight,
    };
};

/** The Nakamoto coefficient represents the minimum number of entities to compromise a given subsystem.
 *  In this context, it represents the number of representatives that must collude together to achieve consensus. */
export const getNakamotoCoefficient = (res): void => {
    calcNakamotoCoefficientPromise()
        .then((nc) => cacheSend(res, nc, NAKAMOTO_COEFFICIENT_CACHE_PAIR))
        .catch((err) => res.status(500).send(err));
};
