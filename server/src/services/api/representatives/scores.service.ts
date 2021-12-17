import { AppCache, REP_SCORES_CACHE_PAIR } from '@app/config';
import { cacheSend, getPRWeightPromise, getRepresentativesPromise } from '@app/services';
import { RepScoreDto } from '@app/types';

/** Use this method to update the list of `onlineRepresentatives` in the AppCache. */
export const getScoresPromise = async (): Promise<RepScoreDto[]> => {
    const reps = await getRepresentativesPromise({
        minimumWeight: 50_000,
        includeNodeMonitorStats: true,
        includeUptimeStats: true,
    });

    const scores = [];
    const principalWeightRequirement = await getPRWeightPromise();
    const onlineReps = new Set(AppCache.onlineRepresentatives);

    for (const rep of reps) {
        const entry = {} as RepScoreDto;
        entry.address = rep.address;
        entry.isMonitored = Boolean(rep.nodeMonitorStats);
        entry.isOnline = onlineReps.has(rep.address);
        entry.weight = rep.weight;
        entry.weightPercentage = rep.weight / (principalWeightRequirement * 1_000) * 100;
        entry.isPrincipal = rep.weight > principalWeightRequirement;
        entry.uptimePercentages = rep.uptimeStats.uptimePercentages;

        // Each rep starts with a score of 0 and is given points for each positive check.
        let score = 0;
        if (entry.isOnline) {
            score += 40;
        }
        if (entry.isMonitored) {
            score += 10;
        }
        if (entry.uptimePercentages?.day > 90) {
            score += 10;
        }
        if (entry.uptimePercentages?.semiAnnual > 95) {
            score += 30;
        }
        if (entry.weightPercentage < 1) {
            score += 10;
        }
        entry.score = score;

        if (score > 10) {
            scores.push(entry);
        }
    }

    scores.sort((a, b) => (a.score > b.score) ? -1 : 1)
    return scores;
};

/** Returns an array of representative scores. */
export const getScores = (res): void => {
    getScoresPromise()
        .then((data) => cacheSend(res, data, REP_SCORES_CACHE_PAIR))
        .catch((err) => res.status(500).send(err));
};
