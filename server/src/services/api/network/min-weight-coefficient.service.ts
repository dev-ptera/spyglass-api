import { cacheSend, countRepsRequiredToOverflowBanAmount, getQuorumPromise } from '@app/services';
import { AppCache, QUORUM_CACHE_PAIR, MIN_WEIGHT_COEFFICIENT_CACHE_PAIR } from '@app/config';
import { MinWeightCoefficientDto, QuorumDto } from '@app/types';

/** Calculates min weight coefficient. */
const calcMinWeightCoefficientPromise = async (): Promise<MinWeightCoefficientDto> => {
    // Use a cached delta value if it's available, otherwise call the Quorum service.
    let quorum: QuorumDto;

    if (AppCache.temp.has(QUORUM_CACHE_PAIR.key)) {
        quorum = AppCache.temp.get(QUORUM_CACHE_PAIR.key);
    } else {
        quorum = await getQuorumPromise().catch(Promise.reject);
    }

    const delta = quorum.onlineWeight - quorum.onlineWeightMinimum;
    const { repsRequiredNumber, representatives, repsWeightSum } = countRepsRequiredToOverflowBanAmount(delta);

    return {
        delta,
        onlineWeight: quorum.onlineWeight,
        onlineWeightMinimum: quorum.onlineWeightMinimum,
        coefficient: repsRequiredNumber,
        representatives: representatives,
        repsWeight: repsWeightSum,
    };
};

/** The Nakamoto coefficient represents the minimum number of entities to compromise a given subsystem.
 *  In this context, it represents the number of representatives that must collude together to achieve consensus. */
export const getMinWeightCoefficientV1 = (res): void => {
    calcMinWeightCoefficientPromise()
        .then((qc) => cacheSend(res, qc, MIN_WEIGHT_COEFFICIENT_CACHE_PAIR))
        .catch((err) => res.status(500).send(err));
};
