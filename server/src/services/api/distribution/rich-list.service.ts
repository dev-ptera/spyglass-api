import { AppCache } from '@app/config';
import { ALL_BALANCES_FILE_NAME, LOG_ERR } from '@app/services';
import { AccountBalanceDto } from '@app/types';
const fs = require('fs');

const MAX_SIZE = 500;

type RequestBody = {
    includeRepresentative?: boolean;
    offset: number;
    size: number;
};

const DEFAULT_BODY: RequestBody = {
    includeRepresentative: false,
    offset: 0,
    size: 50,
};

const setBodyDefaults = (body: RequestBody): void => {
    // Set defaults
    if (body.includeRepresentative === undefined) {
        body.includeRepresentative = DEFAULT_BODY.includeRepresentative;
    }
    if (body.offset === undefined) {
        body.offset = DEFAULT_BODY.offset;
    }
    if (body.size === undefined) {
        body.size = DEFAULT_BODY.size;
    }
    body.size = Math.min(Math.max(0, body.size), MAX_SIZE);
};

export const pruneRepresentatives = (balances: AccountBalanceDto[], includeRep: boolean): AccountBalanceDto[] => {
    if (includeRep) {
        return balances;
    } else {
        const withoutRep = [];
        balances.map((entry) => withoutRep.push({ amount: entry.amount, address: entry.address }));
        return withoutRep;
    }
};

/** Uses the AppCache to return a section of accounts, sorted by balance descending. */
export const getRichList = async (req, res) => {
    setBodyDefaults(req.body);

    const offset = Number(req.body.offset);
    const size = Number(req.body.size);
    const end = Number(offset + size);
    const includeRep = req.body.includeRepresentative;

    if (AppCache.richList.length > 0) {
        const balances = AppCache.richList.slice(offset, end);
        res.send(pruneRepresentatives(balances, includeRep));
    } else {
        const clientErr = { error: 'Account list not loaded yet' };
        fs.readFile(ALL_BALANCES_FILE_NAME, 'utf8', (err, data) => {
            if (err) {
                res.status(500).send(LOG_ERR('getRichList.readFile', clientErr));
            } else {
                try {
                    res.send(includeRep(JSON.parse(data).richList.slice(offset, end), includeRep));
                } catch (err) {
                    res.status(500).send(LOG_ERR('getRichList.parseFile', clientErr));
                }
            }
        });
    }
};
