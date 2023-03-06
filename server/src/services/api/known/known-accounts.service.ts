import axios, { AxiosResponse } from 'axios';
import { KnownAccountDto } from '@app/types';
import { LOG_ERR, LOG_INFO } from '@app/services';
import { AppCache, KNOWN_ACCOUNTS, KNOWN_ACCOUNTS_FILES, PROFILE } from '@app/config';

type RequestBody = {
    includeOwner?: boolean;
    includeType?: boolean;
    includeLore?: boolean;
    typeFilter?: string;
};

const DEFAULT_BODY: RequestBody = {
    includeOwner: false,
    includeType: false,
    includeLore: false,
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
const updateKnownAccountsFromRemote = (knownAccountMap: Map<string, KnownAccountDto>): Promise<void> => {
    const remoteCalls: Array<Promise<AxiosResponse<KnownAccountDto[]>>> = [];
    KNOWN_ACCOUNTS_FILES.map((file) => {
        remoteCalls.push(
            axios.request<KnownAccountDto[]>({
                method: 'GET',
                url: `https://raw.githubusercontent.com/dev-ptera/spyglass-api/master/server/database/${PROFILE}/known-accounts/${file}.json`,
            })
        );
    });

    return Promise.all(remoteCalls)
        .then((knownAccountsResponses) => {
            knownAccountsResponses.map((response) => {
                response.data.map((account) => {
                    if (knownAccountMap.has(account.address)) {
                        knownAccountMap.get(account.address).alias = account.alias;
                        knownAccountMap.get(account.address).owner = account.owner;
                        // TODO: Add ability to update update type/category after fetching remotely.  This functionality might be removed in future releases.
                    } else {
                        knownAccountMap.set(account.address, account);
                    }
                });
            });
            return Promise.resolve();
        })
        .catch((err) => {
            LOG_ERR('updateKnownAccountsFromRemote', err);
            return Promise.resolve();
        });
};

/** Responsible for fetching known accounts from GitHub.  If there is a conflict, use the remote data. */
const getRemoteKnownAccountsPromise = async (): Promise<KnownAccountDto[]> => {
    const start = LOG_INFO('Refreshing Known Accounts');
    const knownAccountMap = new Map<string, KnownAccountDto>();
    KNOWN_ACCOUNTS.map((account) => knownAccountMap.set(account.address, account));
    await updateKnownAccountsFromRemote(knownAccountMap);
    const knownList = Array.from(knownAccountMap.values());
    knownList.sort((a, b) => (a.alias?.toUpperCase() > b.alias?.toUpperCase() ? 1 : -1));
    LOG_INFO('Known Accounts Updated', start);
    return knownList;
};

const getFilterType = (body: RequestBody): string => {
    if (body && body.typeFilter) {
        return body.typeFilter.toLowerCase().trim();
    }
    return undefined;
};

export const filterKnownAccountsByType = (body: RequestBody): KnownAccountDto[] => {
    const accounts: KnownAccountDto[] = [];
    const filter = getFilterType(body);

    AppCache.knownAccounts.map((account) => {
        if (!filter || (filter && account.type === filter)) {
            accounts.push({
                address: account.address,
                alias: account.alias,
                owner: body.includeOwner ? account.owner : undefined,
                type: body.includeType ? account.type : undefined,
                lore: body.includeLore ? account.lore : undefined,
                hasLore: Boolean(account.lore),
            });
        }
    });
    return accounts;
};

/** Returns a list of accounts that are known on the network (exchanges, representatives, funds, etc). */
export const getKnownAccountsV1 = (req, res): void => {
    const body = req.body as RequestBody;
    setBodyDefaults(req.body);
    const accounts = filterKnownAccountsByType(body);
    res.send(accounts);
};

export const getKnownAccountLoreV1 = (req, res): void => {
    const parts = req.url.split('/');
    const address = parts[parts.length - 1];
    const knownAccount = AppCache.knownAccounts.filter((account) => account.address === address)[0];
    if (knownAccount) {
        res.send({ lore: knownAccount.lore });
    }
    res.status(404).send();
};

/** Call this method to update the known accounts in the AppCache. */
export const cacheKnownAccounts = async (): Promise<void> => {
    AppCache.knownAccounts = await getRemoteKnownAccountsPromise(); // TODO: Why even do this?  Just read the local files once.
};
