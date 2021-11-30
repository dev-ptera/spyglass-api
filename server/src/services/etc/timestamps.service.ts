import { AppCache, PROFILE } from '@app/config';
import { LOG_INFO } from '../log/info.service';

const { performance } = require('perf_hooks');
const csv = require('csv-parser');
const fs = require('fs');

export const importHistoricHashTimestamps = (): Promise<void> => {
    const start = LOG_INFO('Importing Historic Hash Timestamps');
    return new Promise((resolve) => {
        fs.createReadStream(`./database/${PROFILE}/timestamps.csv`)
            .pipe(csv())
            .on('data', (row) => {
                // Anything before March 19, 2021 let's use creepers data
                if (row.timestamp < 1616158800) {
                    // TODO: Make me a config variable
                    AppCache.historicHashes.set(row.hash, row.timestamp);
                }
            })
            .on('end', () => {
                LOG_INFO('Historic Hash Timestamps Updated', start);
                console.log(AppCache.historicHashes.size + ' timestamps imported');
                resolve();
            });
    });
};

export const getAccurateHashTimestamp = (hash: string, localTimestamp: string | number): number => {
    if (AppCache.historicHashes.has(hash)) {
        return Math.min(AppCache.historicHashes.get(hash), Number(localTimestamp));
    }
    return Number(localTimestamp);
};
