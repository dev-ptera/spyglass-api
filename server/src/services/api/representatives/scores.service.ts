import { AppCache, REP_SCORES_CACHE_PAIR, UPTIME_TRACKING_MIN_WEIGHT } from '@app/config';
import { cacheSend, getPRWeightPromise, getRepresentativesPromise } from '@app/services';
import { RepScoreDto } from '@app/types';

/** Use this method to update the list of `onlineRepresentatives` in the AppCache. */
export const getScoresPromise = async (): Promise<RepScoreDto[]> => {
    const reps = await getRepresentativesPromise({
        minimumWeight: UPTIME_TRACKING_MIN_WEIGHT,
        includeNodeMonitorStats: true,
        includeAlias: true,
        includeUptimeStats: true,
    });

    const scores = [];
    const principalWeightRequirement = await getPRWeightPromise();
    const onlineReps = new Set(AppCache.onlineRepresentatives);

    let numberOfMonitoredReps = 0;
    let totalUncheckedBlocks = 0;
    let totalCementedBlocks = 0;
    reps.map((rep) => {
        if (rep.nodeMonitorStats) {
            numberOfMonitoredReps++;
            totalUncheckedBlocks += rep.nodeMonitorStats.uncheckedBlocks;
            totalCementedBlocks += rep.nodeMonitorStats.cementedBlocks;
        }
    });

    const avgUncheckedBlocks = totalUncheckedBlocks / (numberOfMonitoredReps || 1);
    const avgCementedBlocks = totalCementedBlocks / (numberOfMonitoredReps || 1);

    for (const rep of reps) {
        const entry = {} as RepScoreDto;
        const isMonitored = Boolean(rep.nodeMonitorStats);
        entry.address = rep.address;
        entry.alias = rep.alias;
        entry.monitorStats = isMonitored ? ({} as any) : undefined;
        entry.online = onlineReps.has(rep.address);
        entry.weight = rep.weight;
        entry.weightPercentage = (rep.weight / (principalWeightRequirement * 1_000)) * 100;
        entry.principal = rep.weight > principalWeightRequirement;
        entry.uptimePercentages = rep.uptimeStats.uptimePercentages;
        entry.daysAge = Number( ((Date.now()- rep.uptimeStats.trackingStartUnixTimestamp) / 86_400_000).toFixed(2));

        // Each rep starts with a score of 0 and is given points for each positive check.
        let score = 0;
        if (entry.weightPercentage < 1) {
            score += 5;
        }
        if (entry.daysAge > 30) {
            score += 5;
        }
        if (entry.daysAge > 55) {
            score += 5;
        }
        if (entry.online) {
            score += 5;
        }

        // Max + 10
        if (isMonitored) {
            const monitorStats = entry.monitorStats;
            entry.monitorStats.name = rep.nodeMonitorStats.name;
            score += 3;
            // Memory is greater than 4GB?
            monitorStats.hasMinMemoryRequirement = rep.nodeMonitorStats.totalMem >= 4096;
            monitorStats.hasAboveAvgCementedBlocks = rep.nodeMonitorStats.cementedBlocks >= avgCementedBlocks;
            monitorStats.hasBelowAvgUncheckedBlocks = rep.nodeMonitorStats.uncheckedBlocks <= avgUncheckedBlocks;

            if (monitorStats.hasAboveAvgCementedBlocks) {
                score += 2;
            }
            if (monitorStats.hasBelowAvgUncheckedBlocks) {
                score += 2;
            }
            if (monitorStats.hasMinMemoryRequirement) {
                score += 3;
            }
        }

        // Max +70
        if (entry.uptimePercentages?.semiAnnual) {
            score += Math.round(entry.uptimePercentages.semiAnnual * 0.70);
        }
        entry.score = score;

        // Remove reps with horrible scores.
        if (score >= 25) {
            scores.push(entry);
        }
    }

    scores.sort((a, b) => (a.score > b.score ? -1 : 1));
    return scores;
};

/** Returns an array of representative scores. Max score is 100, omitting reps with a low score.. */
export const getScoresV1 = (res): void => {
    getScoresPromise()
        .then((data) => cacheSend(res, data, REP_SCORES_CACHE_PAIR))
        .catch((err) => res.status(500).send(err));
};
