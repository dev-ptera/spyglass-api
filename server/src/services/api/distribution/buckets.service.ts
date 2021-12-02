import { frontiersRpc, frontierCountRpc, accountBalanceRpc, accountRepresentativeRpc } from '@app/rpc';
import { convertFromRaw, LOG_ERR, LOG_INFO, printResourceUsage } from '@app/services';
import { AppCache, PROFILE } from '@app/config';
import { AccountBalanceDto, AccountDistributionStatsDto } from '@app/types';
const fs = require('fs');

type FrontiersData = {
    distributionStats: AccountDistributionStatsDto;
    richList: AccountBalanceDto[];
};

/** File which is used to store the list of top holders. */
export const ALL_BALANCES_FILE_NAME = `./database/${PROFILE}/balances.json`;

const createEmptyStats = (): AccountDistributionStatsDto => ({
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
});

/** Uses the frontiers RPC call to iterate through all accounts.
 * Filters out small balance accounts & proceeds to lookup remaining accounts' representative. */
const getFrontiersData = async (): Promise<FrontiersData> => {
    const frontiersCountResponse = await frontierCountRpc().catch((err) =>
        Promise.reject(LOG_ERR('getFrontiersData.getFrontiersCount', err))
    );

    const frontiersResponse = await frontiersRpc(Number(frontiersCountResponse.count)).catch((err) =>
        Promise.reject(LOG_ERR('getFrontiersData.getFrontiers', err))
    );

    // Iterate through each account & add them to a list if they have a large enough balance.
    const accountsList: AccountBalanceDto[] = [];
    const distributionStats: AccountDistributionStatsDto = createEmptyStats();
    for (const address in frontiersResponse.frontiers) {
        try {
            const balanceResponse = await accountBalanceRpc(address);

            // Filter out smaller accounts.
            if (balanceResponse.balance === '0') {
                continue;
            }
            const amount = convertFromRaw(balanceResponse.balance, 4);
            if (amount < 0.0001) {
                continue;
            }

            const accountRep = await accountRepresentativeRpc(address);
            accountsList.push({ address, amount, representative: accountRep.representative });

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
            } else if (amount >= 0.0001) {
                distributionStats.number0_0001++;
            }
        } catch (err) {
            console.error(err);
            continue;
        }
    }

    // Sort by balance descending.
    const richList = accountsList.sort((a: AccountBalanceDto, b: AccountBalanceDto) => {
        if (a.amount > b.amount) return -1;
        if (a.amount < b.amount) return 1;
        return 0;
    });

    return Promise.resolve({
        richList,
        distributionStats,
    });
};

/** Whenever the rich list is still loading due to a server restart, read from a stored file. */
export const parseRichListFromFile = async (): Promise<void> =>
    new Promise((resolve) => {
        const start = LOG_INFO('Refreshing / Importing Rich List File');
        fs.readFile(ALL_BALANCES_FILE_NAME, 'utf8', (err, data) => {
            if (err) {
                LOG_ERR('parseRichListFromFile.readFile', err);
            } else {
                try {
                    const parsed = JSON.parse(data);
                    AppCache.accountDistributionStats = parsed.distributionStats;
                    AppCache.richList = parsed.richList;
                    LOG_INFO('Rich List File Updated', start);
                } catch (err) {
                    LOG_ERR('parseRichListFromFile.parseFile', err);
                }
            }
            resolve();
        });
    });

/** Writes the rich list to a local json file.
 * Whenever the server is restarted, this file is parsed & stored into the AppCache to quickly deliver a snapshot of data. */
const writeLocalRichListJson = (data: FrontiersData): void => {
    fs.writeFile(ALL_BALANCES_FILE_NAME, JSON.stringify(data), { flag: 'w' }, (err) => {
        if (err) {
            LOG_ERR('cacheAccountDistribution.writeFile', err);
        }
    });
};

/** Call this to repopulate the rich list in the AppCache. */
export const cacheAccountDistribution = async (): Promise<void> => {
    const start = LOG_INFO('Refreshing Rich List');
    const data = await getFrontiersData().catch((err) => {
        // If there's any issues retrieving new accounts' balances, use the AppCache data.
        LOG_ERR('cacheAccountDistribution', err);
        return Promise.resolve({
            distributionStats: AppCache.accountDistributionStats,
            richList: AppCache.richList,
        });
    });

    writeLocalRichListJson(data);
    AppCache.accountDistributionStats = data.distributionStats;
    AppCache.richList = data.richList;
    printResourceUsage();
    return LOG_INFO('Rich List Updated', start);
};

/** Returns number of accounts that hold each wealth bucket (eg. [1-10], [10_000-100_000]) */
export const getDistributionBuckets = (res): void => {
    res.send(AppCache.accountDistributionStats);
};
