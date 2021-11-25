import {AppCache, PROFILE} from '@app/config';

const { performance } = require('perf_hooks');
const csv = require('csv-parser');
const fs = require('fs');

export const importHistoricHashTimestamps = (): Promise<void> => {
    console.log('[INFO]: Importing Historic Hash Timestamps');
    const t0 = performance.now();
    return new Promise((resolve) => {
        fs.createReadStream(`./database/${PROFILE}/timestamps.csv`)
            .pipe(csv())
            .on('data', (row) => {
                // Anything before March 19, 2021 let's use creepers data
                if (row.timestamp < 1616158800) { // TODO: Make me a config variable
                    AppCache.historicHashes.set(row.hash, row.timestamp);
                }
            })
            .on('end', () => {
                const t1 = performance.now();
                console.log(`[INFO]: Historic Hash Timestamps Imported, took ${Math.round(t1 - t0)}ms`);
                console.log(AppCache.historicHashes.size + ' timestamps imported');
                resolve();
            });
    })
};

export const getAccurateHashTimestamp = (hash: string, localTimestamp: string | number): number => {
    if (AppCache.historicHashes.has(hash)) {
        return Math.min(AppCache.historicHashes.get(hash), Number(localTimestamp));
    }
    return Number(localTimestamp);
}

