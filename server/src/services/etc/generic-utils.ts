import { rawToBan } from 'banano-unit-converter';
import { AppCache, CachePair, useBananoConfig } from '@app/config';

/** Wait interval in milliseconds. */
export const sleep = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

/** Given RAW, converts to ban or nano. */
export const convertFromRaw = (raw: string, precision = 0): number => {
    if (raw === '0') {
        return 0;
    }
    return Number(Number(rawToBan(raw)).toFixed(precision));
};

export const isValidAddress = (address: string): boolean =>
    address && address.length === 64 && (useBananoConfig() ? address.startsWith('ban_') : address.startsWith('nano_'));

export const printResourceUsage = (): void => {
    const used = process.memoryUsage();
    for (let key in used) {
        console.log(`${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`);
    }
};

/** Converts minutes to milliseconds. */
export const minutesToMs = (minutes: number) => minutes * 1000 * 60;

/** Converts seconds to milliseconds. */
export const secondsToMs = (seconds: number) => seconds * 1000;

/** Sends response, caches result for specified time. */
export const cacheSend = (res, data, cachePair: CachePair) => {
    AppCache.temp.put(cachePair.key, data, cachePair.duration);
    res.send(data);
};

export const cacheSend2 = (res, data, key: string, duration: number) => {
    AppCache.temp.put(key, data, duration);
    res.send(data);
};

/** Caches result for specified time. */
export const cache = (data, cachePair: CachePair) => {
    AppCache.temp.put(cachePair.key, data, cachePair.duration);
};
