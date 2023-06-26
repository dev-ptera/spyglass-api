import { cacheSend, countRepsRequiredToOverflowBanAmount, getQuorumPromise } from '@app/services';
import { AppCache, QUORUM_CACHE_PAIR, MIN_WEIGHT_COEFFICIENT_CACHE_PAIR } from '@app/config';
import { QuorumCoefficientDto, QuorumDto } from '@app/types';

/** Calculates quorum coefficient -- how many nodes have to disagree on consensus for quorum to be disrupted & network stalled? */
const calcQuorumCoefficientPromise = async (): Promise<QuorumCoefficientDto> => {
    // Use a cached delta value if it's available, otherwise call the Quorum service.
    let quorum: QuorumDto;

    if (AppCache.temp.has(QUORUM_CACHE_PAIR.key)) {
        quorum = AppCache.temp.get(QUORUM_CACHE_PAIR.key);
    } else {
        quorum = await getQuorumPromise().catch(Promise.reject);
    }

    const delta = ((100 - quorum.onlineWeightQuorumPercent) / 100) * quorum.onlineWeight;
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
export const getQuorumCoefficientV1 = (res): void => {
    calcQuorumCoefficientPromise()
        .then((qc) => cacheSend(res, qc, MIN_WEIGHT_COEFFICIENT_CACHE_PAIR))
        .catch((err) => res.status(500).send(err));
};
