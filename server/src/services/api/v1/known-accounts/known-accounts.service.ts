import axios, { AxiosResponse } from 'axios';
import { AppCache } from '@app/config';
import { KnownAccountDto } from '@app/types';
import { LOG_INFO, LOG_ERR } from '@app/services';
import { MANUAL_ACCOUNTS } from './manual-accounts';

/** Makes API call to Kirby's API to fetch known accounts list. */
const getKnownAccountsPromise = (): Promise<KnownAccountDto[]> =>
    new Promise<KnownAccountDto[]>((resolve, reject) => {
        axios
            .request({
                method: 'GET',
                url: 'https://kirby.eu.pythonanywhere.com/api/v1/resources/addresses/all',
            })
            .then((response: AxiosResponse<KnownAccountDto[]>) => resolve(response.data))
            .catch(reject);
    });

/** Saves known accounts in the App Cache. */
export const cacheKnownAccounts = (): Promise<void> => {
    return new Promise((resolve) => {
        const start = LOG_INFO('Refreshing Known Accounts');
        getKnownAccountsPromise()
            .then((apiAccounts: KnownAccountDto[]) => {
                const knownAccounts = new Map<string, KnownAccountDto>();

                /* Add API accounts to the map. */
                for (const account of apiAccounts) {
                    knownAccounts.set(account.address, account);
                }

                /* Use the manual list to override any API account aliases or add new entries */
                for (const account of MANUAL_ACCOUNTS) {
                    if (knownAccounts.has(account.address)) {
                        knownAccounts.get(account.address).alias = account.alias;
                    } else {
                        knownAccounts.set(account.address, account);
                    }
                }

                const dto: KnownAccountDto[] = [];
                for (const address of knownAccounts.keys()) {
                    dto.push({
                        address,
                        alias: knownAccounts.get(address).alias,
                        illicit: knownAccounts.get(address).illicit,
                        owner: knownAccounts.get(address).owner,
                        type: knownAccounts.get(address).type,
                    });
                }

                dto.sort((a, b) => (a.alias?.toUpperCase() > b.alias?.toUpperCase() ? 1 : -1));
                AppCache.knownAccounts = dto;
                resolve(LOG_INFO('Known Accounts Updated', start));
            })
            .catch((err) => {
                resolve(LOG_ERR('cacheKnownAccounts', err));
            });
    });
};
