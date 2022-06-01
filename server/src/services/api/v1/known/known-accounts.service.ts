import axios, { AxiosResponse } from 'axios';
import { KnownAccountDto, KnownAccountType } from '@app/types';
import { LOG_ERR, LOG_INFO } from '@app/services';
import { AppCache, KNOWN_ACCOUNTS, PROFILE } from '@app/config';

type RequestBody = {
    includeOwner?: boolean;
    includeType?: boolean;
    typeFilter?: KnownAccountType;
};

const DEFAULT_BODY: RequestBody = {
    includeOwner: false,
    includeType: false,
    typeFilter: '',
};

const setBodyDefaults = (body: RequestBody): void => {
    if (body.includeOwner === undefined) {
        body.includeOwner = DEFAULT_BODY.includeOwner;
    }
    if (body.includeType === undefined) {
        body.includeType = DEFAULT_BODY.includeType;
    }
    if (body.typeFilter === undefined) {
        body.typeFilter = DEFAULT_BODY.typeFilter;
    }
};

/** Fetches remote spyglass known accounts, falls back to local known accounts data. */
const fetchSpyglassRemoteKnownAccounts = (): Promise<KnownAccountDto[]> =>
    new Promise<KnownAccountDto[]>((resolve) => {
        axios
            .request({
                method: 'GET',
                url: `https://raw.githubusercontent.com/dev-ptera/spyglass-api/master/server/database/${PROFILE}/known-accounts.json`,
            })
            .then((response: AxiosResponse<KnownAccountDto[]>) => resolve(response.data))
            .catch((err) => {
                LOG_ERR('fetchSpyglassRemoteKnownAccounts', err);
                resolve(KNOWN_ACCOUNTS);
            });
    });

/** Responsible for fetching known accounts from local/remote sources.
 *
 * Order of insertion:
 * 1. Local entries via KNOWN_ACCOUNTS.
 * 2. Kirby API
 * 3. Remote KNOWN_ACCOUNTS via spyglass-api master branch.
 * */
const getKnownAccountsPromise = async (): Promise<KnownAccountDto[]> => {
    const start = LOG_INFO('Refreshing Known Accounts');
    const spyglassKnownAccountsRemote = await fetchSpyglassRemoteKnownAccounts();
    const knownAccountMap = new Map<string, KnownAccountDto>();

    /* Spyglass entries are entered next & override any duplicate fields. */
    spyglassKnownAccountsRemote.map((account) => {
        insertEntries(account, knownAccountMap);
    });

    const accounts = Array.from(knownAccountMap.values());
    accounts.sort((a, b) => (a.alias?.toUpperCase() > b.alias?.toUpperCase() ? 1 : -1));
    LOG_INFO('Known Accounts Updated', start);
    return accounts;
};

const insertEntries = (newInfo: KnownAccountDto, map: Map<string, KnownAccountDto>): void => {
    // Make sure this field is all lowercase.
    if (newInfo.type) {
        newInfo.type = newInfo.type.toLowerCase() as any;
    }

    // Handle new insertions.
    const previouslyKnown = map.get(newInfo.address);
    if (!previouslyKnown) {
        map.set(newInfo.address, newInfo);
        return;
    }

    // Handle overwriting existing entries.
    if (newInfo.type) {
        previouslyKnown.type = newInfo.type;
    }
    if (newInfo.alias) {
        previouslyKnown.alias = newInfo.alias;
    }
    if (newInfo.owner) {
        previouslyKnown.owner = newInfo.owner;
    }
};

export const filterKnownAccounts = (body: RequestBody): KnownAccountDto[] => {
    if (!body || !body.typeFilter) {
        return AppCache.knownAccounts;
    }
    const accounts: KnownAccountDto[] = [];
    const filter = body.typeFilter.toLowerCase().trim();
    AppCache.knownAccounts.map((account) => {
        if (!filter || (filter && account.type === filter)) {
            accounts.push({
                address: account.address,
                alias: account.alias,
                owner: body.includeOwner ? account.owner : undefined,
                type: body.includeType ? account.type : undefined,
            });
        }
    });
    return accounts;
};

/** Returns a list of accounts that are known on the network (exchanges, representatives, funds, etc). */
export const getKnownAccountsV1 = (req, res): void => {
    const body = req.body as RequestBody;
    setBodyDefaults(req.body);
    const accounts = filterKnownAccounts(body);
    res.send(accounts);
};

/** Call this method to update the known accounts in the AppCache. */
export const cacheKnownAccounts = async (): Promise<void> => {
    AppCache.knownAccounts = await getKnownAccountsPromise();
};
