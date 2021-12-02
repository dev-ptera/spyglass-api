import { convertFromRaw, LOG_ERR } from '@app/services';
import { AppCache, NANO_CLIENT } from '@app/config';
import { NakamotoCoefficientDto } from '@app/types';

/** Calculates nakamoto coefficient. */
export const calcNakamotoCoefficientPromise = async (): Promise<NakamotoCoefficientDto> => {
    const delta = await NANO_CLIENT.confirmation_quorum()
        .then((data) => convertFromRaw(data.quorum_delta))
        .catch((err) => Promise.reject(LOG_ERR('calcNakamotoCoefficientPromise.confirmation_quorum', err)));

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
        .then((nc) => res.send(nc))
        .catch((err) => res.status(500).send(err));
};
