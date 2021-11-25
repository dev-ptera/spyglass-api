import {
    AppCache,
    IS_PRODUCTION,
    PROFILE,
    REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS,
    UPTIME_TRACKING_MIN_WEIGHT
} from '@app/config';
import { LastOutage, PingStats, RepresentativeUptimeDto } from '@app/types';
import { getRepresentativesPromise, LOG_ERR, LOG_INFO } from '@app/services';


type RequestBody = {
    representatives: string[];
    includePings: boolean;
};

const DEFAULT_BODY: RequestBody = {
    representatives: [],
    includePings: false,
};

const fs = require('fs');

const MINIMUM_WEIGHT_TO_MEASURE_UPTIME = UPTIME_TRACKING_MIN_WEIGHT;
const dayMaxPings = 86_400_000 / REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS;
const weekMaxPings = 604_800_000 / REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS;
const monthMaxPings = 2_629_800_000 / REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS;
const semiAnnualMaxPings = (6 * 2_629_800_000) / REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS;
const yearMaxPings = (12 * 2_629_800_000) / REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS;

type PingDoc = {
    address: string;
    trackStartUnixTimestamp: number;
    trackStartDate: string;
    pingStats: PingStats[];
};

/** Given a list of pings, where 1 represents ONLINE and 0 represents OFFLINE, returns online percentage. */
export const calculateUptimePercentage = (online: number, total: number): number => {
    return Number(((online / total) * 100).toFixed(5));
};

/** Given a rep address, returns the location o the file to write to store rep uptime. */
const formatDocName = (repAddress: string): string =>
    `database/${PROFILE}/${IS_PRODUCTION ? 'rep-uptime' : 'rep-uptime-dev'}/${repAddress}.json`;

/** Returns data for how long a rep has been online. Either reads from file, or uses internal map if populated. */
const getRepDoc = async (repAddress: string): Promise<PingDoc> => {
    return new Promise(async (resolve) => {
        await fs.readFile(formatDocName(repAddress), 'utf8', (err, data) => {
            err ? resolve(undefined) : resolve(JSON.parse(data));
        });
    });
};

/** Stores updated ping data in local collection of JSON files. */
const writeRepDoc = async (data: PingDoc): Promise<void> => {
    return new Promise(async (resolve) => {
        await fs.writeFile(formatDocName(data.address), JSON.stringify(data, null, 4), { flag: 'w' }, (err) => {
            if (err) {
                console.log('[ERROR]: Writing rep-uptime file', err);
                LOG_ERR('representativeUptimeService.writeRepDoc', err, { data });
            }
            resolve();
        });
    });
};

/** Stores representative ping data in a local JSON file. */
export const writeRepStatistics = async (repAddress: string, isOnline: boolean) => {
    const data = await getRepDoc(repAddress);
    const emptyDoc = !data || !data.pingStats || !data.pingStats[data.pingStats.length - 1];

    // 1 === ONLINE | 0 === OFFLINE
    if (emptyDoc) {
        const initialPing = isOnline ? { 1: 1 } : { 0: 1 };
        await writeRepDoc({
            address: repAddress,
            trackStartDate: new Date().toLocaleDateString(),
            trackStartUnixTimestamp: new Date().getTime(),
            pingStats: [initialPing],
        });
    } else {
        const pingStats = data.pingStats;
        const lastPing = pingStats[pingStats.length - 1];
        if (isOnline) {
            if (lastPing['1']) {
                lastPing['1']++; // Rep is still online.
            } else {
                pingStats.push({ 1: 1 }); // Rep has just come online.
            }
        } else {
            if (lastPing['0']) {
                lastPing['0']++; // Rep is still offline.
            } else {
                pingStats.push({ 0: 1 }); // Rep has just come offline.
            }
        }
        await writeRepDoc({
            address: data.address,
            trackStartDate: data.trackStartDate,
            trackStartUnixTimestamp: data.trackStartUnixTimestamp,
            pingStats,
        });
    }
    return Promise.resolve();
};

const minutesToMs = (mins: number): number => mins * 60 * 1000;

/** Given a PingStats array, calculates when (if) a last outage has occurred. */
const calculateLastOutageStatistics = (pingStats: PingStats[]): LastOutage => {
    let outageDurationMinutes = 0;
    let minutesSinceLastOutage = 0;
    let hasFoundOffline = false;
    let lastOutage = undefined;
    for (let i = pingStats.length - 1; i >= 0; i--) {
        const currPingStat = pingStats[i];
        if (currPingStat['1'] && hasFoundOffline) {
            const now = Date.now();
            const onlineUnixTimestamp = now - minutesToMs(minutesSinceLastOutage);
            const offlineUnixTimestamp = onlineUnixTimestamp - minutesToMs(outageDurationMinutes);
            lastOutage = {
                offlineUnixTimestamp: offlineUnixTimestamp,
                offlineDate: new Date(offlineUnixTimestamp).toLocaleDateString(),
                onlineUnixTimestamp: onlineUnixTimestamp,
                onlineDate: new Date(onlineUnixTimestamp).toLocaleDateString(),
                durationMinutes: outageDurationMinutes,
            };
            break;
        }
        if (currPingStat['1']) {
            minutesSinceLastOutage += currPingStat['1'];
        } else {
            hasFoundOffline = true;
            outageDurationMinutes += currPingStat['0'];
        }
    }
    return lastOutage;
};

/** Given a PingStats array, calculates daily, weekly, etc uptime statistics. */
const calculateUptimePercentages = (pingStats: PingStats[]) => {
    const makeNewPingTracker = () => ({ offline: 0, online: 0 });
    const dayPings = makeNewPingTracker();
    const weekPings = makeNewPingTracker();
    const monthPings = makeNewPingTracker();
    const semiAnnualPings = makeNewPingTracker();
    const yearPings = makeNewPingTracker();

    /* Iterates between all pingSets, starting from most-recent. */
    let pingTotal = 0;
    for (let i = pingStats.length - 1; i >= 0; i--) {
        const currPingStat = pingStats[i];
        const online = Boolean(currPingStat['1']);
        let duration = currPingStat['1'] || currPingStat['0'];
        while (duration > 0) {
            if (pingTotal < dayMaxPings) online ? dayPings.online++ : dayPings.offline++;
            if (pingTotal < weekMaxPings) online ? weekPings.online++ : weekPings.offline++;
            if (pingTotal < monthMaxPings) online ? monthPings.online++ : monthPings.offline++;
            if (pingTotal < semiAnnualMaxPings) online ? semiAnnualPings.online++ : semiAnnualPings.offline++;
            if (pingTotal < yearMaxPings) online ? yearPings.online++ : yearPings.offline++;
            pingTotal++;
            duration--;
        }
    }
    return {
        day: calculateUptimePercentage(dayPings.online, dayMaxPings),
        week: calculateUptimePercentage(weekPings.online, weekMaxPings),
        month: calculateUptimePercentage(monthPings.online, monthMaxPings),
        semiAnnual: calculateUptimePercentage(semiAnnualPings.online, semiAnnualMaxPings),
        year: calculateUptimePercentage(yearPings.online, yearMaxPings),
    };
};

/** Calculates uptime statistics and last-outage statistics. */
export const calculateUptimeStatistics = (data: PingDoc, includePings: boolean): RepresentativeUptimeDto => {
    const pingStats = data.pingStats;
    const mostRecentPingIndex = pingStats.length - 1;
    const isRepCurrentlyOnline = Boolean(pingStats[mostRecentPingIndex]['1']);
    const uptimePercentages = calculateUptimePercentages(pingStats);
    const lastOutage = calculateLastOutageStatistics(pingStats);
    const uptimeDto: RepresentativeUptimeDto = {
        address: data.address,
        trackingStartDate: data.trackStartDate,
        trackingStartUnixTimestamp: data.trackStartUnixTimestamp,
        online: isRepCurrentlyOnline,
        pingStats: includePings ? pingStats : undefined,
        uptimePercentages,
        lastOutage,
    };
    return uptimeDto;
};

/** Responsible for writing to each representatives' uptime database file. */
export const writeNewRepresentativeUptimePings = async (): Promise<void> => {
    const start = LOG_INFO('Refreshing Uptime Pings');
    const onlineReps = AppCache.onlineRepresentatives;
    const onlineRepsSet = new Set(onlineReps);
    const largeReps = await getRepresentativesPromise({
        minimumWeight: MINIMUM_WEIGHT_TO_MEASURE_UPTIME,
    });
    largeReps.map((rep) => writeRepStatistics(rep.address, onlineRepsSet.has(rep.address)));
    LOG_INFO('Uptime Pings Updated', start);
};

export const getRepresentativesUptimePromise = async (body: RequestBody): Promise<RepresentativeUptimeDto[]> => {
    if (body.representatives === undefined) {
        body.representatives = DEFAULT_BODY.representatives;
    }
    if (body.includePings === undefined) {
        body.includePings = DEFAULT_BODY.includePings;
    }
    const uptimeStats: RepresentativeUptimeDto[] = [];
    for (const address of body.representatives) {
        const data = await getRepDoc(address);
        if (!data) {
            continue;
        }
        const repUptime = calculateUptimeStatistics(data, body.includePings);
        uptimeStats.push(repUptime);
    }
    return uptimeStats;
};

/** Returns uptime metrics for a list of representatives. */
export const getRepresentativesUptime = async (req, res): Promise<RepresentativeUptimeDto[]> => {
    const body = req.body as RequestBody;
    const uptimeStats = await getRepresentativesUptimePromise(body);
    res.send(uptimeStats);
    return uptimeStats;
};
