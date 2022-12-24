import { frontiersRpc, frontierCountRpc, accountBalanceRpc, accountRepresentativeRpc } from '@app/rpc';
import { convertFromRaw, LOG_ERR, LOG_INFO, printResourceUsage } from '@app/services';
import { AppCache } from '@app/config';
import { AccountBalanceDto, AccountDistributionStatsDto } from '@app/types';
import { REDIS_CLIENT } from '../../../redis/client';

type FrontiersData = {
    distributionStats: AccountDistributionStatsDto;
    richList: AccountBalanceDto[];
};

const DISTRIBUTION_STATS_KEY = 'creeper_distribution_stats';
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

/** Read rich list from redis. */
export const readRichListDB = async (): Promise<void> => {
    try {
        const data = await REDIS_CLIENT.get(DISTRIBUTION_STATS_KEY);
        if (!data) {
            return;
        }
        const balances = JSON.parse(data) as FrontiersData;
        AppCache.richList = balances.richList;
        AppCache.accountDistributionStats = balances.distributionStats;
    } catch (err) {
        LOG_ERR('readRichListDB', err);
    }
};

/** Stores rich list in redis. */
const storeRichListDB = async (data: FrontiersData): Promise<void> => {
    try {
        await REDIS_CLIENT.set(DISTRIBUTION_STATS_KEY, JSON.stringify(data));
    } catch (err) {
        LOG_ERR('storeRichListDB', err);
    }
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

    AppCache.accountDistributionStats = data.distributionStats;
    AppCache.richList = data.richList;
    await storeRichListDB(data);
    printResourceUsage();
    return LOG_INFO('Rich List Updated', start);
};

/** Returns number of accounts that hold each wealth bucket (eg. [1-10], [10_000-100_000]) */
export const getDistributionBucketsV1 = (res): void => {
    res.send(AppCache.accountDistributionStats);
};
