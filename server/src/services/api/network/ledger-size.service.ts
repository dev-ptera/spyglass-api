import { cacheSend, LOG_ERR } from '@app/services';
import { LEDGER_SIZE_CACHE_PAIR } from '@app/config';
import { LedgerSizeDto } from '@app/types';

const getSize = require('get-folder-size');
const LEDGER_LOCATION = process.env.LEDGER_LOCATION;

/** Calculates ledger size. Requires the LEDGER_LOCATION env config variable is set & directory is readable. */
export const getLedgerSizePromise = async (): Promise<LedgerSizeDto> =>
    new Promise((resolve) => {
        getSize(LEDGER_LOCATION, (err, size) => {
            if (err) {
                LOG_ERR('getNodeStats.getLedgerSize', err);
                resolve(undefined);
            }
            const ledgerSizeMB = Number((size / 1000 / 1000).toFixed(2));
            resolve({ ledgerSizeMB });
        });
    });

export const getLedgerSizeV1 = (res): void => {
    getLedgerSizePromise()
        .then((data) => {
            if (data) {
                cacheSend(res, data, LEDGER_SIZE_CACHE_PAIR)
            } else {
                res.status(500).send({ error: 'Unable to read ledger size' });
            }
        })
        .catch((err) => res.status(500).send(err));
};
