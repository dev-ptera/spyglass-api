import { cacheSend, LOG_ERR } from '@app/services';
import { LEDGER_LOCATION, LEDGER_SIZE_CACHE_PAIR } from '@app/config';
import { LedgerSizeDto } from '@app/types';

const getSize = require('get-folder-size');

/** Calculates ledger size. Requires the LEDGER_LOCATION app config variable is set & directory is readable. */
const getLedgerSizePromise = async (): Promise<LedgerSizeDto> =>
    new Promise((resolve, reject) => {
        getSize(LEDGER_LOCATION, (err, size) => {
            if (err) {
                LOG_ERR('getNodeStats.getLedgerSize', err);
                return reject({ error: 'Unable to read ledger size' });
            }
            const ledgerSizeMB = Number((size / 1000 / 1000).toFixed(2));
            resolve({ ledgerSizeMB });
        });
    });

export const getLedgerSizeV1 = (res): void => {
    getLedgerSizePromise()
        .then((data) => cacheSend(res, data, LEDGER_SIZE_CACHE_PAIR))
        .catch((err) => res.status(500).send(err));
};
