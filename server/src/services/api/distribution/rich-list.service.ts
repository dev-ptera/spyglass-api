import { AppCache } from '@app/config';
import { LOG_ERR } from '@app/services';
import { AccountBalanceDto } from '@app/types';

/** Max number of records to return. */
const MAX_SIZE = 500;

type RequestBody = {
    includeRepresentative?: boolean;
    offset?: number;
    size?: number;
};

const DEFAULT_BODY: RequestBody = {
    includeRepresentative: false,
    offset: 0,
    size: 50,
};

const setBodyDefaults = (body: RequestBody): void => {
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

/** Returns a list of accounts with, or without, their respective representatives.  */
export const pruneRepresentatives = (balances: AccountBalanceDto[], includeRep: boolean): AccountBalanceDto[] => {
    if (includeRep) {
        return balances;
    }
    const withoutRep = [];
    balances.map((entry) => withoutRep.push({ amount: entry.amount, address: entry.address }));
    return withoutRep;
};

/** Uses the AppCache to return a list of accounts & their respective balance, sorted by balance descending. */
export const getRichList = (req, res) => {
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
        res.status(500).send(LOG_ERR('getRichList', clientErr));
    }
};

/** Return Rich List Snapshot */
export const getRichListSnapshot = (res) => {
    res.send(AppCache.richList);
};


/** Return Rich List Snapshot */
export const getRichListSnapshotPost = (req, res) => {
    setBodyDefaults(req.body);
    const list = [];
    AppCache.richList.map((entry) => list.push(Object.assign({}, entry)));
    if (!req.body.includeRepresentative) {
        list.map((entry) => entry.representative = undefined);
    }
    res.send(list);
};
