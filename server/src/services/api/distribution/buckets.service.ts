import { frontiersRpc, frontierCountRpc, accountBalanceRpc, accountRepresentativeRpc } from '@app/rpc';
import { convertFromRaw, LOG_ERR, LOG_INFO } from '@app/services';
import { AppCache } from '@app/config';
import { AccountBalanceDto, AccountDistributionStatsDto } from '@app/types';
import { FrontierCountResponse } from '@dev-ptera/nano-node-rpc';
const fs = require('fs');

/** File which is used to store the list of top holders. */
export const ALL_BALANCES_FILE_NAME = './database/banano/balances.json';

/** Uses the frontiers RPC call to iterate through all accounts.
 * Filters out small balance accounts & proceeds to lookup remaining accounts' representative. */
export const getFrontiersData = async (): Promise<{
    distributionStats: AccountDistributionStatsDto;
    richList: AccountBalanceDto[];
}> => {
    const frontiersCountResponse: FrontierCountResponse = await frontierCountRpc().catch((err) => {
        return Promise.reject(LOG_ERR('cacheAccountDistribution.getFrontiersCount', err));
    });
    const frontiersResponse = await frontiersRpc(Number(frontiersCountResponse.count)).catch((err) => {
        return Promise.reject(LOG_ERR('cacheAccountDistribution.getFrontiers', err));
    });

    const richList: AccountBalanceDto[] = [];
    const distributionStats: AccountDistributionStatsDto = {
        number0_0001: 0,
        number0_001: 0,
        number0_01: 0,
        number0_1: 0,
        number1: 0,
        number10: 0,
        number100: 0,
        number1_000: 0,
        number10_000: 0,
        number100_000: 0,
        number1_000_000: 0,
        number10_000_000: 0,
        number100_000_000: 0,
        totalAccounts: 0,
    };
    for (const address in frontiersResponse.frontiers) {
        try {
            const balanceResponse = await accountBalanceRpc(address);
            const accountRep = await accountRepresentativeRpc(address);
            if (balanceResponse.balance !== '0') {
                const amount = convertFromRaw(balanceResponse.balance, 4);
                // Add to address list
                if (amount >= 0.0001) {
                    richList.push({ address, amount, representative: accountRep.representative });
                } else {
                    continue;
                }

                // Bucket balances
                distributionStats.totalAccounts++;
                if (amount > 100_000_000) {
                    distributionStats.number100_000_000++;
                } else if (amount > 10_000_000) {
                    distributionStats.number10_000_000++;
                } else if (amount > 1_000_000) {
                    distributionStats.number1_000_000++;
                } else if (amount > 100_000) {
                    distributionStats.number100_000++;
                } else if (amount > 10_000) {
                    distributionStats.number10_000++;
                } else if (amount > 1_000) {
                    distributionStats.number1_000++;
                } else if (amount > 100) {
                    distributionStats.number100++;
                } else if (amount > 10) {
                    distributionStats.number10++;
                } else if (amount > 1) {
                    distributionStats.number1++;
                } else if (amount > 0.1) {
                    distributionStats.number0_1++;
                } else if (amount > 0.01) {
                    distributionStats.number0_01++;
                } else if (amount >= 0.001) {
                    distributionStats.number0_001++;
                }  else if (amount >= 0.0001) {
                    distributionStats.number0_0001++;
                }
            }
        } catch (err) {
            console.error(err);
            continue;
        }
    }

    // Sort by balance descending.
    const sortedAccounts = richList.sort((a: AccountBalanceDto, b: AccountBalanceDto) => {
        if (a.amount > b.amount) return -1;
        if (a.amount < b.amount) return 1;
        return 0;
    });
    return Promise.resolve({
        richList: sortedAccounts,
        distributionStats,
    });
};

/** Whenever the rich list is still loading due to a server restart, read from a stored file.  Prevents unnecessary downtime of Wallets page. */
export const parseRichListFromFile = async (): Promise<void> =>
    new Promise((resolve) => {
        const start = LOG_INFO('Refreshing Accounts Distribution File');
        fs.readFile(ALL_BALANCES_FILE_NAME, 'utf8', (err, data) => {
            if (err) {
                LOG_ERR('parseRichListFromFile.readFile', err);
            } else {
                try {
                    const parsed = JSON.parse(data);
                    AppCache.accountDistributionStats = parsed.distributionStats;
                    AppCache.richList = parsed.richList;
                    LOG_INFO('Accounts Distribution File Updated', start);
                } catch (err) {
                    LOG_ERR('parseRichListFromFile.parseFile', err);
                }
            }
            resolve();
        });
    });

/** Call this to repopulate the rich list in the AppCache. */
export const cacheAccountDistribution = async (): Promise<void> => {
    return new Promise((resolve) => {
        const start = LOG_INFO('Refreshing Rich List');
        getFrontiersData()
            .then((data) => {
                fs.writeFile(ALL_BALANCES_FILE_NAME, JSON.stringify(data), { flag: 'w' }, (err) => {
                    if (err) {
                        LOG_ERR('cacheAccountDistribution.writeFile', err);
                    }
                });
                AppCache.accountDistributionStats = data.distributionStats;
                AppCache.richList = data.richList;
                const used = process.memoryUsage();
                for (let key in used) {
                    console.log(`${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`);
                }
                resolve(LOG_INFO('Rich List Updated', start));
            })
            .catch((err) => {
                LOG_ERR('cacheAccountDistribution', err);
                resolve();
            });
    });
};

export const getDistributionBuckets = (res): void => {
    res.send(AppCache.accountDistributionStats);
};
