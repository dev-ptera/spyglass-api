import {convertFromRaw, getRepresentativesPromise, LOG_ERR} from "@app/services";
import {NANO_CLIENT} from "@app/config";
import {NakamotoCoefficientDto} from "@app/types";

export const calcNakamotoCoefficientPromise = async (): Promise<NakamotoCoefficientDto> => {
    const onlineReps = await getRepresentativesPromise({ isOnline: true }).catch((err) => Promise.reject(err));
    const rawQuorum = await NANO_CLIENT.confirmation_quorum().catch((err) => Promise.reject(err));
    const delta = convertFromRaw(rawQuorum.quorum_delta);
    const ncRepresentatives = [];
    let ncRepsWeight = 0;
    let nakamotoCoefficient = 0;
    for (const rep of onlineReps) {
        ncRepsWeight += rep.weight;
        ncRepresentatives.push(rep);
        nakamotoCoefficient++;
        if (ncRepsWeight > delta) {
            break;
        }
    }
    return {
        delta,
        nakamotoCoefficient,
        ncRepresentatives,
        ncRepsWeight,
    }
};

export const getNakamotoCoefficient = async (req, res): Promise<void> => {
    calcNakamotoCoefficientPromise().then((nc) => res.send(nc))
        .catch((err) => res.status(500).send(LOG_ERR('getNakamotoCoefficient', err)));
}
