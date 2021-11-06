import { AppCache } from '@app/config';
import { ALL_BALANCES_FILE_NAME } from './account-distribution.service';
import { LOG_ERR } from '@app/services';
const fs = require('fs');

const MAX_RECORDS_PER_PAGE = 25;
const DEFAULT_RECORDS_PER_PAGE = 25;

/** Uses the AppCache to return a section of all known accounts. */
export const getRichList = async (req, res) => {
    const offset = Number(req.query.offset || 0);
    const size = Math.min(MAX_RECORDS_PER_PAGE, req.query.size || DEFAULT_RECORDS_PER_PAGE);
    const end = Number(offset + size);

    if (AppCache.richList.length > 0) {
        const addresses = AppCache.richList.slice(offset, end);
        res.send(addresses);
    } else {
        const clientErr = { error: 'Account list not loaded yet' };
        fs.readFile(ALL_BALANCES_FILE_NAME, 'utf8', (err, data) => {
            if (err) {
                res.status(500).send(LOG_ERR('getRichList.readFile', clientErr));
            } else {
                try {
                    res.send(JSON.parse(data).richList.slice(offset, end));
                } catch (err) {
                    res.status(500).send(LOG_ERR('getRichList.parseFile', clientErr));
                }
            }
        });
    }
};
