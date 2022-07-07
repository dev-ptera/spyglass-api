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

/** Responsible for fetching known accounts from GitHub.  If there is a conflict, use the remote data. */
const getRemoteKnownAccountsPromise = async (): Promise<KnownAccountDto[]> => {
    const start = LOG_INFO('Refreshing Known Accounts');
    const spyglassKnownAccountsRemote = await fetchSpyglassRemoteKnownAccounts();
    const knownAccountMap = new Map<string, KnownAccountDto>();

    KNOWN_ACCOUNTS.map((account) => knownAccountMap.set(account.address, account));

    try {
        // We want to use the remote data rather than what we originally had, since it is updated more frequently.
        spyglassKnownAccountsRemote.map((account) => {
            knownAccountMap.set(account.address, account);
        });

        const knownList = Array.from(knownAccountMap.values());
        knownList.sort((a, b) => (a.alias?.toUpperCase() > b.alias?.toUpperCase() ? 1 : -1));
        LOG_INFO('Known Accounts Updated', start);
        return knownList;
    } catch (err) {
        LOG_ERR('getRemoteKnownAccountsPromise', err);
        return KNOWN_ACCOUNTS;
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
    AppCache.knownAccounts = await getRemoteKnownAccountsPromise();
};
