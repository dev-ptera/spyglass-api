import { cacheSend, LOG_ERR, minutesToMs } from '@app/services';
import { AppCache, LEDGER_LOCATION } from '@app/config';
import { LedgerSizeDto } from '@app/types';

const getSize = require('get-folder-size');
const LEDGER_SIZE_CACHE_KEY = 'ledgerSize';

/** Calculates ledger size. Requires the LEDGER_LOCATION app config variable is set & directory is readable. */
const getLedgerSizePromise = async (): Promise<LedgerSizeDto> =>
    new Promise((resolve, reject) => {
        getSize(LEDGER_LOCATION, (err, size) => {
            if (err) {
                LOG_ERR('getNodeStats.getLedgerSize', err);
                return reject({ error: 'Unable to read ledger size' });
            }
            const ledgerSizeMb = Number((size / 1000 / 1000).toFixed(2));
            resolve({ ledgerSizeMb });
        });
    });

export const getLedgerSize = (res): void => {
    getLedgerSizePromise()
        .then((data) => cacheSend(res, data, LEDGER_SIZE_CACHE_KEY, minutesToMs(10)))
        .catch((err) => res.status(500).send(err));
};
