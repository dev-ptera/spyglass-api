import axios, { AxiosResponse } from 'axios';
import { KnownAccountDto } from '@app/types';
import { LOG_ERR, LOG_INFO } from '@app/services';
import {AppCache, KNOWN_ACCOUNTS, PROFILE} from '@app/config';
const fs = require('fs');

type RequestBody = {
    includeOwner?: boolean;
    includeType?: boolean;
    typeFilter?: string;
};

const DEFAULT_BODY: RequestBody = {
    includeOwner: false,
    includeType: false,
    typeFilter: '',
};

/** Converts the KNOWN_ACCOUNTS object to a json file.
 * This file isThis is used to update KNOWN_ACCOUNTS without restarting the server. */
export const convertManualKnownAccountsToJson = (): void => {
    const file = `database/${PROFILE}/known-accounts.json`;
    fs.writeFile(`${file}`, JSON.stringify(KNOWN_ACCOUNTS, null, 2), (err) => {
        if (err) {
            LOG_ERR('convertManualKnownAccountsToJson', err);
            throw err;
        }
    });
}

/** Makes API call to Remote spyglass json file to fetch known accounts. */
const fetchSpyglassRemoteKnownAccounts = (): Promise<KnownAccountDto[]> =>
    new Promise<KnownAccountDto[]>((resolve) => {
        axios
            .request({
                method: 'GET',
                url: `https://raw.githubusercontent.com/dev-ptera/spyglass-api/master/server/database/${PROFILE}/known-accounts.json`
            })
            .then((response: AxiosResponse<KnownAccountDto[]>) => resolve(response.data))
            .catch((err) => {
                LOG_ERR('fetchSpyglassRemoteKnownAccounts', err);
                resolve([]);
            });
    });

/** Makes API call to Kirby's API to fetch known accounts list. */
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

const getKnownAccountsPromise = async (): Promise<KnownAccountDto[]> => {
    const start = LOG_INFO('Refreshing Known Accounts');
    const kirbyKnownAccounts = await fetchKirbyKnownAccounts();
    const spyglassKnownAccountsRemote = await fetchSpyglassRemoteKnownAccounts();
    const knownAccountMap = new Map<string, KnownAccountDto>();

    // On initial load, use the KNOWN_ACCOUNTS var.
    if (AppCache.knownAccounts.length === 0) {
        KNOWN_ACCOUNTS.map((account) => knownAccountMap.set(account.address, account));
    }

    // Clear the list if we pulled down the new list successfully.
    if (spyglassKnownAccountsRemote.length > 0) {
        AppCache.knownAccounts = [];
    } else {
        /* Add existing known accounts to the map so we don't lose any past data. */
        AppCache.knownAccounts.map((account) => knownAccountMap.set(account.address, account));
    }

    /* Kirby entries are entered first. */
    for (const kirbyKnownAccount of kirbyKnownAccounts) {
        if (kirbyKnownAccount.type) {
            kirbyKnownAccount.type = kirbyKnownAccount.type.toLowerCase() as any;
        }
        knownAccountMap.set(kirbyKnownAccount.address, kirbyKnownAccount);
    }

    /* Spyglass entries are entered next & override any duplicates. */
    for (const spyglassKnownAccount of spyglassKnownAccountsRemote) {
        if (knownAccountMap.has(spyglassKnownAccount.address)) {
            knownAccountMap.get(spyglassKnownAccount.address).alias = spyglassKnownAccount.alias;
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

export const getKnownAccounts = (req, res): void => {
    const body = req.body as RequestBody;
    if (body.includeOwner === undefined) {
        body.includeOwner = DEFAULT_BODY.includeOwner;
    }
    if (body.includeType === undefined) {
        body.includeType = DEFAULT_BODY.includeType;
    }
    if (body.typeFilter === undefined) {
        body.typeFilter = DEFAULT_BODY.typeFilter;
    }
    const accounts = filterKnownAccounts(body);
    res.send(accounts);
};

/** This is called every X minutes to update the KnownAccounts app cache. */
export const cacheKnownAccounts = async (): Promise<void> => {
    AppCache.knownAccounts = await getKnownAccountsPromise();
};
