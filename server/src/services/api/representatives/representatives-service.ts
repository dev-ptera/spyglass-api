import { AppCache, NANO_CLIENT } from '@app/config';
import { rawToBan } from 'banano-unit-converter';
import {
    populateDelegatorsCount,
    getRepresentativesUptimePromise,
    getPRWeightPromise,
    getAliasedReps,
} from '@app/services';
import { RepresentativeDto } from '@app/types';

type RequestBody = {
    addresses?: string[];
    isOnline?: boolean;
    isPrincipal?: boolean;
    isMonitored?: boolean;
    includeAlias?: boolean;
    includeDelegatorCount?: boolean;
    includeNodeMonitorStats?: boolean;
    includeUptimeStats?: boolean;
    includeUptimePings?: boolean;
    minimumWeight?: number;
    maximumWeight?: number;
    uptimeThresholdDay?: number;
    uptimeThresholdWeek?: number;
    uptimeThresholdMonth?: number;
    uptimeThresholdSemiAnnual?: number;
    uptimeThresholdYear?: number;
};

const DEFAULT_BODY: RequestBody = {
    addresses: [],
    isMonitored: false,
    isOnline: false,
    isPrincipal: false,
    includeAlias: false,
    includeDelegatorCount: false,
    includeNodeMonitorStats: false,
    includeUptimePings: false,
    includeUptimeStats: false,
    minimumWeight: 10_000,
    maximumWeight: Number.MAX_SAFE_INTEGER,
};

const setBodyDefaults = (body: RequestBody): void => {
    // Set defaults
    if (body.addresses === undefined) {
        body.addresses = DEFAULT_BODY.addresses;
    }
    if (body.includeDelegatorCount === undefined) {
        body.includeDelegatorCount = DEFAULT_BODY.includeDelegatorCount;
    }
    if (body.includeNodeMonitorStats === undefined) {
        body.includeNodeMonitorStats = DEFAULT_BODY.includeNodeMonitorStats;
    }
    if (body.includeUptimeStats === undefined) {
        body.includeUptimeStats = DEFAULT_BODY.includeUptimeStats;
    }
    if (body.isMonitored === undefined) {
        body.isMonitored = DEFAULT_BODY.isMonitored;
    }
    if (body.isOnline === undefined) {
        body.isOnline = DEFAULT_BODY.isOnline;
    }
    if (body.isPrincipal === undefined) {
        body.isPrincipal = DEFAULT_BODY.isPrincipal;
    }
    if (body.maximumWeight === undefined) {
        body.maximumWeight = DEFAULT_BODY.maximumWeight;
    }
    if (body.minimumWeight === undefined) {
        body.minimumWeight = DEFAULT_BODY.minimumWeight;
    }

    // Minimum weight to be counted in the list.
    body.minimumWeight = Math.max(body.minimumWeight, 1000);

    // Trim spaces off of each filter address.
    body.addresses.map((addr) => addr.trim());
};

const filterByUptimeThreshold = (
    key: keyof RepresentativeDto['uptimeStats']['uptimePercentages'],
    threshold: number,
    repMap: Map<string, RepresentativeDto>
): void => {
    for (const address of repMap.keys()) {
        const rep = repMap.get(address);
        if (rep.uptimeStats && rep.uptimeStats.uptimePercentages[key] < threshold) {
            repMap.delete(address);
        }
    }
};

export const getRepresentativesPromise = async (body: RequestBody): Promise<RepresentativeDto[]> => {
    const rpcData = await NANO_CLIENT.representatives(5000, true);
    const repMap = new Map<string, RepresentativeDto>();
    setBodyDefaults(body);

    // Filters reps by weight & address restrictions.
    const maxWeight = Number(body.maximumWeight);
    const minWeight = Number(body.minimumWeight);
    const filterAddress = new Set(body.addresses);
    for (const address in rpcData.representatives) {
        const raw = rpcData.representatives[address];
        const weight = Math.round(Number(rawToBan(raw)));

        if (filterAddress.size > 0 && !filterAddress.has(address)) {
            continue;
        }

        if (weight >= minWeight && weight <= maxWeight) {
            repMap.set(address, { address, weight });
        }
        // Terminates loop early; results have to be sorted by weight descending for this to work.
        if (weight <= minWeight) {
            break;
        }
    }

    // Filter map to only include Online Representatives
    if (body.isOnline) {
        const onlineReps = AppCache.onlineRepresentatives;
        const onlineAddresses = new Set<string>();
        onlineReps.map((rep) => onlineAddresses.add(rep));
        for (const address of repMap.keys()) {
            if (!onlineAddresses.has(address)) {
                repMap.delete(address);
            }
        }
    }

    // Filter map to only include Principal Representatives
    if (body.isPrincipal) {
        const principalWeightRequirement = await getPRWeightPromise();
        for (const address of repMap.keys()) {
            if (repMap.get(address).weight < principalWeightRequirement) {
                repMap.delete(address);
            }
        }
    }

    // Append delegatorsCount to each rep.
    if (body.includeDelegatorCount) {
        await populateDelegatorsCount(repMap);
    }

    // Append alias to each rep.
    if (body.includeAlias) {
        const aliasedReps = getAliasedReps();
        for (const aliasedRep of aliasedReps) {
            const rep = repMap.get(aliasedRep.address);
            if (rep) {
                rep.alias = aliasedRep.alias;
            }
        }
    }

    // Append node monitor stats to each rep.
    if (body.includeNodeMonitorStats) {
        const monitoredReps = AppCache.monitoredReps;
        for (const stats of monitoredReps) {
            const rep = repMap.get(stats.address);
            if (rep) {
                rep.nodeMonitorStats = { ...stats };
                rep.nodeMonitorStats.address = undefined;
                rep.nodeMonitorStats.online = undefined;
            }
        }
    }

    // Filter to only include monitored representatives.
    if (body.isMonitored) {
        const monitoredReps = AppCache.monitoredReps;
        const monitoredRepSet = new Set<string>();
        for (const stats of monitoredReps) {
            monitoredRepSet.add(stats.address);
        }
        for (const address of repMap.keys()) {
            if (!monitoredRepSet.has(address)) {
                repMap.delete(address);
            }
        }
    }

    // Append uptime stats to each rep.
    if (body.includeUptimeStats) {
        const uptimeStats = await getRepresentativesUptimePromise({
            representatives: Array.from(repMap.keys()),
            includePings: body.includeUptimePings,
        });
        for (const stats of uptimeStats) {
            const rep = repMap.get(stats.address);
            stats.address = undefined;
            stats.online = undefined;
            if (rep) {
                rep.uptimeStats = stats;
            }
        }
    }

    // Filter out via uptime threshold requirements
    if (body.uptimeThresholdDay) {
        filterByUptimeThreshold('day', body.uptimeThresholdDay, repMap);
    }
    if (body.uptimeThresholdWeek) {
        filterByUptimeThreshold('week', body.uptimeThresholdWeek, repMap);
    }
    if (body.uptimeThresholdMonth) {
        filterByUptimeThreshold('month', body.uptimeThresholdMonth, repMap);
    }
    if (body.uptimeThresholdSemiAnnual) {
        filterByUptimeThreshold('semiAnnual', body.uptimeThresholdSemiAnnual, repMap);
    }
    if (body.uptimeThresholdYear) {
        filterByUptimeThreshold('year', body.uptimeThresholdYear, repMap);
    }

    // Construct large rep response-types dto
    const reps: RepresentativeDto[] = Array.from(repMap.values());
    return reps;
};

/**
 * Gets the top 5000 representatives & filters out smaller ones.
 */
export const getRepresentatives = (req, res): void => {
    const body = req.body as RequestBody;
    getRepresentativesPromise(body)
        .then((reps) => res.send(reps))
        .catch((err) => res.status(500).send(err));
};
