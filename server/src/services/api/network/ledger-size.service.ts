import { LOG_ERR, minutesToMs } from '@app/services';
import { AppCache, LEDGER_LOCATION } from '@app/config';
import { LedgerSizeDto } from '@app/types';

const getSize = require('get-folder-size');
const LEDGER_SIZE_CACHE_KEY = 'ledgerSize';

/** Calculates ledger size. Requires the LEDGER_LOCATION app config variable is set & directory is readable. */
const getLedgerSizePromise = async (): Promise<LedgerSizeDto> =>
    new Promise((resolve, reject) => {
        let cachedMemSize = AppCache.temp.get(LEDGER_SIZE_CACHE_KEY);
        if (cachedMemSize) {
            console.log('using cache');
            resolve({ ledgerSizeMb: cachedMemSize });
        }

        getSize(LEDGER_LOCATION, (err, size) => {
            if (err) {
                LOG_ERR('getNodeStats.getLedgerSize', err);
                return reject({ error: 'Unable to read ledger size' });
            }
            console.log('not using cache');
            const ledgerSizeMb = Number((size / 1000 / 1000).toFixed(2));
            AppCache.temp.put(LEDGER_SIZE_CACHE_KEY, ledgerSizeMb, minutesToMs(10));
            resolve({ ledgerSizeMb });
        });
    });

export const getLedgerSize = (res): void => {
    getLedgerSizePromise()
        .then((data) => res.send(data))
        .catch((err) => res.status(500).send(err));
};
