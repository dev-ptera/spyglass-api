import { AppCache, IS_PRODUCTION, REPRESENTATIVES_REFRESH_INTERVAL_MS } from '@app/config';
import { Ping, RepPingMapData, RepresentativeUptimeDto } from '@app/types';
import { LOG_ERR } from '@app/services';

const fs = require('fs');

const dayMaxPings = 86_400_000 / REPRESENTATIVES_REFRESH_INTERVAL_MS;
const weekMaxPings = 604_800_000 / REPRESENTATIVES_REFRESH_INTERVAL_MS;
const monthMaxPings = 2_629_800_000 / REPRESENTATIVES_REFRESH_INTERVAL_MS;
const semiAnnualMaxPings = (6 * 2_629_800_000) / REPRESENTATIVES_REFRESH_INTERVAL_MS;
const yearMaxPings = (12 * 2_629_800_000) / REPRESENTATIVES_REFRESH_INTERVAL_MS;

/** Given a list of pings, where 1 represents ONLINE and 0 represents OFFLINE, returns online percentage. */
export const calculateUptimePercentage = (pings: Ping[]): number => {
    let onlinePings = 0;
    for (const ping of pings) {
        if (ping === 1) {
            onlinePings++;
        }
    }
    return Number(((onlinePings / pings.length) * 100).toFixed(1));
};

/** Given a rep address, returns the location o the file to write to store rep uptime. */
const formatDocName = (repAddress: string): string =>
    `src/database/${IS_PRODUCTION ? 'rep-uptime' : 'rep-uptime-dev'}/${repAddress}.json`;

/** Returns data for how long a rep has been online. Either reads from file, or uses internal map if populated. */
const getRepDoc = async (repAddress: string): Promise<RepPingMapData> => {
    if (AppCache.dbRepPings.has(repAddress)) {
        return AppCache.dbRepPings.get(repAddress);
    }
    const newPingMap = {
        day: [],
        week: [],
        month: [],
        semiAnnual: [],
        year: [],
    };

    return new Promise(async (resolve) => {
        await fs.readFile(formatDocName(repAddress), 'utf8', (err, data) => {
            err ? resolve(newPingMap) : resolve(JSON.parse(data));
        });
    });
};

/** Stores updated ping data in local collection of JSON files. */
const writeRepDoc = async (data: RepPingMapData, repAddress: string): Promise<void> => {
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

    // Remove older pings
    if (data.day.length > dayMaxPings) {
        data.day.shift();
    }
    if (data.week.length > weekMaxPings) {
        data.week.shift();
    }
    if (data.month.length > monthMaxPings) {
        data.month.shift();
    }
    if (data.semiAnnual.length > semiAnnualMaxPings) {
        data.semiAnnual.shift();
    }
    if (data.year.length > yearMaxPings) {
        data.year.shift();
    }

    // 1 === ONLINE | 0 === OFFLINE
    data.day.push(isOnline ? 1 : 0);
    data.week.push(isOnline ? 1 : 0);
    data.month.push(isOnline ? 1 : 0);
    data.semiAnnual.push(isOnline ? 1 : 0);
    data.year.push(isOnline ? 1 : 0);

    await writeRepDoc(data, repAddress);
    AppCache.dbRepPings.set(repAddress, data);
    return Promise.resolve();
};

const minsToMs = (mins: number): number => mins * 60 * 1000;

export const calculateUptimeStatistics = (repAddress: string, repPings: RepPingMapData): RepresentativeUptimeDto => {
    const yearPings = Array.from(repPings.year);
    yearPings.reverse();

    const online = yearPings[0] === 1;
    let outageDurationMinutes = 0;
    let minutesSinceLastOutage = 0;
    let hasFoundOffline = false;

    // Each ping represents 5 minutes.
    // Calc last offline time.
    for (const ping of yearPings) {
        if (ping === 1 && hasFoundOffline) {
            break;
        }
        if (ping === 1) {
            minutesSinceLastOutage += 5;
        }
        if (ping === 0) {
            hasFoundOffline = true;
            outageDurationMinutes += 5;
        }
    }

    const now = Date.now();
    const repAgeMinutes = yearPings.length * 5;
    const creationUnixTimestamp = now - minsToMs(repAgeMinutes);
    const creationDate = new Date(creationUnixTimestamp).toLocaleDateString();
    const uptimeDto: RepresentativeUptimeDto = {
        address: repAddress,
        online,
        uptimePercentDay: calculateUptimePercentage(repPings.day),
        uptimePercentWeek: calculateUptimePercentage(repPings.week),
        uptimePercentMonth: calculateUptimePercentage(repPings.month),
        uptimePercentSemiAnnual: calculateUptimePercentage(repPings.semiAnnual),
        uptimePercentYear: calculateUptimePercentage(repPings.year),
        creationUnixTimestamp,
        creationDate,
    };

    if (hasFoundOffline) {
        const onlineUnixTimestamp = now - minsToMs(minutesSinceLastOutage);
        const offlineUnixTimestamp = onlineUnixTimestamp - minsToMs(outageDurationMinutes);
        uptimeDto.lastOutage = {
            offlineUnixTimestamp: offlineUnixTimestamp,
            offlineDate: new Date(offlineUnixTimestamp).toLocaleDateString(),
            onlineUnixTimestamp: onlineUnixTimestamp,
            onlineDate: new Date(onlineUnixTimestamp).toLocaleDateString(),
            durationMinutes: outageDurationMinutes,
        };
    }
    return uptimeDto;
};

/** Returns uptime metrics for a given representative. */
export const getRepresentativeUptime = async (req, res): Promise<void> => {
    const parts = req.url.split('/');
    const repAddress = parts[parts.length - 1];
    const repPings: RepPingMapData = await getRepDoc(repAddress);
    const yearPings = repPings.year;

    if (!yearPings || yearPings.length === 0) {
        res.status(500).send({ error: `No uptime data for representative: ${repAddress}` });
        return Promise.resolve();
    }

    const dto = calculateUptimeStatistics(repAddress, repPings);
    res.send(dto);
    return Promise.resolve();
};
