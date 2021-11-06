import { AppCache } from '@app/config';

const { performance } = require('perf_hooks');
const csv = require('csv-parser');
const fs = require('fs');

export const importHistoricHashTimestamps = (): void => {
    console.log('[INFO]: Importing Historic Hash Timestamps');
    const t0 = performance.now();
    fs.createReadStream('./src/historic/timestamps.csv')
        .pipe(csv())
        .on('data', (row) => {
            AppCache.historicHash.set(row.hash, row.timestamp);
        })
        .on('end', () => {
            const t1 = performance.now();
            console.log(`[INFO]: Historic Hash Timestamps Imported, took ${Math.round(t1 - t0)}ms`);
        });
};
