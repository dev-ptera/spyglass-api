import { AppCache, PROFILE } from '@app/config';
import { LOG_INFO } from '../log/info.service';
import { LOG_ERR } from '../log/error.service';

const { performance } = require('perf_hooks');
const csv = require('csv-parser');
const fs = require('fs');

export const importHistoricHashTimestamps = (): Promise<void> => {
    const start = LOG_INFO('Importing Historic Hash Timestamps');
    return new Promise((resolve) => {
        try {
            const rs = fs.createReadStream(`./database/${PROFILE}/timestamps.csv`);
            rs.on('error', function () {
                console.log(
                    'Could not import historic timestamps; file does not exist.' +
                        ' See the README for a historic timestamp snapshot.'
                );
                resolve();
            });

            rs.pipe(csv())
                .on('data', (row) => {
                    // Anything before March 19, 2021 let's use creepers data
                    if (row.timestamp < 1616158800) {
                        // TODO: MOVE ME TO ENV.
                        // TODO: Make me a config variable
                        AppCache.historicHashes.set(row.hash, row.timestamp);
                    }
                })
                .on('end', () => {
                    LOG_INFO('Historic Hash Timestamps Updated', start);
                    console.log(AppCache.historicHashes.size + ' timestamps imported');
                    resolve();
                });
        } catch (err) {
            LOG_ERR('importHistoricHashTimestamps', err);
            resolve();
        }
    });
};

export const getAccurateHashTimestamp = (hash: string, localTimestamp: string | number): number => {
    if (AppCache.historicHashes.has(hash)) {
        return Math.min(AppCache.historicHashes.get(hash), Number(localTimestamp));
    }
    return Number(localTimestamp);
};
