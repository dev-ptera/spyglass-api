import axios, { AxiosResponse } from 'axios';
import { MANUAL_ACCOUNTS } from './manual-accounts';
import { KnownAccountDto } from '@app/types';
import { LOG_ERR, LOG_INFO } from '@app/services';

/** Makes API call to Kirby's API to fetch known accounts list. */
const getRemoveKnownAccounts = (): Promise<KnownAccountDto[]> =>
    new Promise<KnownAccountDto[]>((resolve, reject) => {
        axios
            .request({
                method: 'GET',
                url: 'https://kirby.eu.pythonanywhere.com/api/v1/resources/addresses/all',
            })
            .then((response: AxiosResponse<KnownAccountDto[]>) => resolve(response.data))
            .catch(reject);
    });

export const getKnownAccountsPromise = (): Promise<KnownAccountDto[]> => {
    return new Promise((resolve) => {
        const start = LOG_INFO('Refreshing Known Accounts');
        getRemoveKnownAccounts()
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
                LOG_INFO('Known Accounts Updated', start);
                resolve(dto);
            })
            .catch((err) => {
                LOG_ERR('cacheKnownAccounts', err);
                resolve([]);
            });
    });
};

export const getKnownAccounts = async (req, res): Promise<KnownAccountDto[]> => {
    const knownAccounts = await getKnownAccountsPromise();
    res.send(knownAccounts);
    return knownAccounts;
};
