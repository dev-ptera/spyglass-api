import axios, { AxiosResponse } from 'axios';
import { KnownAccountDto, KnownAccountType } from '@app/types';
import { LOG_ERR, LOG_INFO } from '@app/services';
import { AppCache, KNOWN_ACCOUNTS, PROFILE } from '@app/config';
const fs = require('fs');

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

/** Fetches remote spyglass known accounts. */
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
                resolve([]);
            });
    });

/** Fetches known accounts from Kirby's API.  */
const fetchKirbyKnownAccounts = (): Promise<KnownAccountDto[]> =>
    new Promise<KnownAccountDto[]>((resolve) => {
        axios
            .request({
                method: 'GET',
                url: 'https://kirby.eu.pythonanywhere.com/api/v1/resources/addresses/all',
            })
            .then((response: AxiosResponse<KnownAccountDto[]>) => resolve(response.data))
            .catch((err) => {
                LOG_ERR('fetchKirbyKnownAccounts', err);
                resolve([]);
            });
    });

/** Responsible for fetching known accounts from local/remote sources. */
const getKnownAccountsPromise = async (): Promise<KnownAccountDto[]> => {
    const start = LOG_INFO('Refreshing Known Accounts');
    const kirbyKnownAccounts = await fetchKirbyKnownAccounts();
    const spyglassKnownAccountsRemote = await fetchSpyglassRemoteKnownAccounts();
    const knownAccountMap = new Map<string, KnownAccountDto>();

    // On initial load, use the local KNOWN_ACCOUNTS data.
    if (AppCache.knownAccounts.length === 0) {
        KNOWN_ACCOUNTS.map((account) => knownAccountMap.set(account.address, account));
    }

    // Clear the list if we pulled down the new list successfully.
    if (spyglassKnownAccountsRemote.length > 0) {
        AppCache.knownAccounts = [];
    } else {
        // Add existing known accounts to the map so we don't lose any past data.
        AppCache.knownAccounts.map((account) => knownAccountMap.set(account.address, account));
    }

    /* Kirby entries are entered first. */
    for (const kirbyKnownAccount of kirbyKnownAccounts) {
        if (kirbyKnownAccount.type) {
            kirbyKnownAccount.type = kirbyKnownAccount.type.toLowerCase() as any;
        }
        knownAccountMap.set(kirbyKnownAccount.address, kirbyKnownAccount);
    }

    /* Spyglass entries are entered next & override any duplicate aliases. */
    for (const spyglassKnownAccount of spyglassKnownAccountsRemote) {
        const prevEntry = knownAccountMap.get(spyglassKnownAccount.address);
        if (prevEntry) {
            prevEntry.owner = spyglassKnownAccount.owner || prevEntry.owner;
            prevEntry.type = spyglassKnownAccount.type || prevEntry.type;
            prevEntry.alias = spyglassKnownAccount.alias || prevEntry.alias;
        } else {
            knownAccountMap.set(spyglassKnownAccount.address, spyglassKnownAccount);
        }
    }

    const accounts = Array.from(knownAccountMap.values());
    accounts.sort((a, b) => (a.alias?.toUpperCase() > b.alias?.toUpperCase() ? 1 : -1));
    LOG_INFO('Known Accounts Updated', start);
    return accounts;
};

export const filterKnownAccounts = (body: RequestBody): KnownAccountDto[] => {
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
export const getKnownAccounts = (req, res): void => {
    const body = req.body as RequestBody;
    setBodyDefaults(req.body);
    const accounts = filterKnownAccounts(body);
    res.send(accounts);
};

/** Call this method to update the known accounts in the AppCache. */
export const cacheKnownAccounts = async (): Promise<void> => {
    AppCache.knownAccounts = await getKnownAccountsPromise();
};

/** Converts the KNOWN_ACCOUNTS object to a json file;
 * The JSON file is then fetched remotely from the master branch to allow updates without restarting the server. */
export const convertManualKnownAccountsToJson = (): void => {
    const file = `database/${PROFILE}/known-accounts.json`;
    fs.writeFile(`${file}`, JSON.stringify(KNOWN_ACCOUNTS, null, 2), (err) => {
        if (err) {
            LOG_ERR('convertManualKnownAccountsToJson', err);
            throw err;
        }
    });
};
