import axios, { AxiosResponse } from 'axios';
import { KnownAccountDto } from '@app/types';
import { LOG_ERR, LOG_INFO } from '@app/services';
import { AppCache, KNOWN_ACCOUNTS } from '@app/config';

type RequestBody = {
    includeOwner?: boolean;
    includeType?: boolean;
};

const DEFAULT_BODY: RequestBody = {
    includeOwner: false,
    includeType: false,
};

/** Makes API call to Kirby's API to fetch known accounts list. */
const fetchRemoteKnownAccounts = (): Promise<KnownAccountDto[]> =>
    new Promise<KnownAccountDto[]>((resolve, reject) => {
        axios
            .request({
                method: 'GET',
                url: 'https://kirby.eu.pythonanywhere.com/api/v1/resources/addresses/all',
            })
            .then((response: AxiosResponse<KnownAccountDto[]>) => resolve(response.data))
            .catch(reject);
    });

const getKnownAccountsPromise = (): Promise<KnownAccountDto[]> => {
    return new Promise((resolve) => {
        const start = LOG_INFO('Refreshing Known Accounts');
        fetchRemoteKnownAccounts()
            .then((remoteAccounts: KnownAccountDto[]) => {
                const knownAccountMap = new Map<string, KnownAccountDto>();

                /* Add existing known accounts to the map so we don't lose any past data. */
                AppCache.knownAccounts.map((account) => knownAccountMap.set(account.address, account));

                /* Add API accounts to the map. */
                for (const account of remoteAccounts) {
                    if (account.type) {
                        // @ts-ignore // Make sure the received 'type' is in lowercase.
                        account.type = account.type.toLowerCase();
                    }
                    knownAccountMap.set(account.address, account);
                }

                /* Use the manual list to override any API account aliases or add new entries */
                for (const account of KNOWN_ACCOUNTS) {
                    if (knownAccountMap.has(account.address)) {
                        knownAccountMap.get(account.address).alias = account.alias;
                    } else {
                        knownAccountMap.set(account.address, account);
                    }
                }

                const accounts = Array.from(knownAccountMap.values());
                accounts.sort((a, b) => (a.alias?.toUpperCase() > b.alias?.toUpperCase() ? 1 : -1));
                LOG_INFO('Known Accounts Updated', start);
                resolve(accounts);
            })
            .catch((err) => {
                LOG_ERR('getKnownAccountsPromise', err);
                resolve([]);
            });
    });
};

export const filterKnownAccounts = (body: RequestBody): KnownAccountDto[] => {
    const accounts: KnownAccountDto[] = [];
    AppCache.knownAccounts.map((account) => {
        accounts.push({
            address: account.address,
            alias: account.alias,
            owner: body.includeOwner ? account.owner : undefined,
            type: body.includeType ? account.type : undefined,
        });
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
    const accounts = filterKnownAccounts(body);
    res.send(accounts);
};

/** This is called every X minutes to update the KnownAccounts app cache. */
export const cacheKnownAccounts = async (): Promise<void> => {
    AppCache.knownAccounts = await getKnownAccountsPromise();
};
