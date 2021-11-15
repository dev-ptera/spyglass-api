import { IS_PRODUCTION, REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS } from '@app/config';
import { RepresentativeUptimeDto } from '@app/types';
import { LOG_ERR } from '@app/services';

type RequestBody = {
    representatives: string[];
    includePings: boolean;
};

const DEFAULT_BODY: RequestBody = {
    representatives: [],
    includePings: false,
};

const fs = require('fs');

const dayMaxPings = 86_400_000 / REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS;
const weekMaxPings = 604_800_000 / REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS;
const monthMaxPings = 2_629_800_000 / REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS;
const semiAnnualMaxPings = (6 * 2_629_800_000) / REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS;
const yearMaxPings = (12 * 2_629_800_000) / REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS;

type Ping = '1' | '0';

/** Given a list of pings, where 1 represents ONLINE and 0 represents OFFLINE, returns online percentage. */
export const calculateUptimePercentage = (pings: Ping[]): number => {
    let onlinePings = 0;
    for (const ping of pings) {
        if (ping === '1') {
            onlinePings++;
        }
    }
    return Number(((onlinePings / pings.length) * 100).toFixed(1));
};

/** Given a rep address, returns the location o the file to write to store rep uptime. */
const formatDocName = (repAddress: string): string =>
    `src/database/${IS_PRODUCTION ? 'rep-uptime' : 'rep-uptime-dev'}/${repAddress}.json`;

/** Returns data for how long a rep has been online. Either reads from file, or uses internal map if populated. */
const getRepDoc = async (repAddress: string): Promise<{ pings: string }> => {
    //    if (AppCache.dbRepPings.has(repAddress)) {
    //        return AppCache.dbRepPings.get(repAddress);
    //    }

    return new Promise(async (resolve) => {
        await fs.readFile(formatDocName(repAddress), 'utf8', (err, data) => {
            err ? resolve({ pings: '' }) : resolve(JSON.parse(data));
        });
    });
};

/** Stores updated ping data in local collection of JSON files. */
const writeRepDoc = async (data: { pings: string }, repAddress: string): Promise<void> => {
    return new Promise(async (resolve) => {
        await fs.writeFile(formatDocName(repAddress), JSON.stringify(data), { flag: 'w' }, (err) => {
            if (err) {
                console.log('[ERROR]: Writing rep-uptime file', err);
                LOG_ERR('representativeUptimeService.writeRepDoc', err, { repAddress });
            }
            resolve();
        });
    });
};

/** Stores representative ping data in a local JSON file. */
export const writeRepStatistics = async (repAddress: string, isOnline: boolean) => {
    const data = await getRepDoc(repAddress);
    let pings = data.pings;
    // Remove older pings, anything after 1 year will be removed.
    if (pings.length > yearMaxPings) {
        pings = pings.substring(1, pings.length);
    }
    // 1 === ONLINE | 0 === OFFLINE
    pings = `${pings}${isOnline ? 1 : 0}`;
    await writeRepDoc({ pings }, repAddress);
    //  AppCache.dbRepPings.set(repAddress, data);
    return Promise.resolve();
};

const minutesToMs = (mins: number): number => mins * 60 * 1000;

/** Given an address and a string that of repPings (only 1s or 0s), calculates uptime statistics. */
export const calculateUptimeStatistics = (
    repAddress: string,
    repPings: string,
    includePings: boolean
): RepresentativeUptimeDto => {
    const allPings = repPings.split('').reverse() as Ping[];
    const online = allPings[0] === '1';
    let outageDurationMinutes = 0;
    let minutesSinceLastOutage = 0;
    let hasFoundOffline = false;

    // Each ping represents 1 minute over the past year.
    // Calculates last offline time & breaks up ping data in daily, weekly, monthly, and semi-annual sets.
    const i = 0;
    const dayPings = [];
    const weekPings = [];
    const monthPings = [];
    const semiAnnualPings = [];
    for (const ping of allPings) {
        if (i < dayMaxPings) dayPings.push(ping);
        if (i < weekMaxPings) weekPings.push(ping);
        if (i < monthMaxPings) monthPings.push(ping);
        if (i < semiAnnualMaxPings) semiAnnualPings.push(ping);
        if (ping === '1' && hasFoundOffline) break;
        if (ping === '1') minutesSinceLastOutage++;
        if (ping === '0') {
            hasFoundOffline = true;
            outageDurationMinutes++;
        }
    }

    const now = Date.now();
    const repAgeMinutes = allPings.length;
    const creationUnixTimestamp = now - minutesToMs(repAgeMinutes);
    const creationDate = new Date(creationUnixTimestamp).toLocaleDateString();
    const uptimeDto: RepresentativeUptimeDto = {
        address: repAddress,
        trackingStartDate: creationDate,
        trackingStartUnixTimestamp: creationUnixTimestamp,
        online,
        uptimePercentages: {
            day: calculateUptimePercentage(dayPings),
            week: calculateUptimePercentage(weekPings),
            month: calculateUptimePercentage(monthPings),
            semiAnnual: calculateUptimePercentage(semiAnnualPings),
            year: calculateUptimePercentage(allPings),
        },
    };

    if (hasFoundOffline) {
        const onlineUnixTimestamp = now - minutesToMs(minutesSinceLastOutage);
        const offlineUnixTimestamp = onlineUnixTimestamp - minutesToMs(outageDurationMinutes);
        uptimeDto.lastOutage = {
            offlineUnixTimestamp: offlineUnixTimestamp,
            offlineDate: new Date(offlineUnixTimestamp).toLocaleDateString(),
            onlineUnixTimestamp: onlineUnixTimestamp,
            onlineDate: new Date(onlineUnixTimestamp).toLocaleDateString(),
            durationMinutes: outageDurationMinutes,
        };
    }

    if (includePings) {
        uptimeDto.pings = repPings;
    }
    return uptimeDto;
};

export const getRepresentativesUptimePromise = async (body: RequestBody): Promise<RepresentativeUptimeDto[]> => {
    const uptimeStats: RepresentativeUptimeDto[] = [];
    for (const address of body.representatives) {
        const data = await getRepDoc(address);
        if (!data.pings) {
            continue;
        }
        const repUptime = calculateUptimeStatistics(address, data.pings, body.includePings);
        uptimeStats.push(repUptime);
    }
    return uptimeStats;
};

/** Returns uptime metrics for a list of representatives. */
export const getRepresentativesUptime = async (req, res): Promise<RepresentativeUptimeDto[]> => {
    const body = req.body as RequestBody;
    if (body.representatives === undefined) {
        body.representatives = DEFAULT_BODY.representatives;
    }
    if (body.includePings === undefined) {
        body.includePings = DEFAULT_BODY.includePings;
    }
    const uptimeStats = await getRepresentativesUptimePromise(body);
    res.send(uptimeStats);
    return uptimeStats;
};
