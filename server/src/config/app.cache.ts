import {
    AccountBalanceDto,
    AccountDistributionStatsDto,
    KnownAccountDto,
    MonitoredRepresentativeDto,
    PriceDataDto,
} from '@app/types';
import { CacheClass } from 'memory-cache';
const cache = require('memory-cache');

export type AppCache = {
    /** Graph data for distribution. */
    accountDistributionStats: AccountDistributionStatsDto;

    /** A map of hash to unix timestamp for blocks that occurred prior to this node's sync date. */
    historicHashes: Map<string, number>;

    /** Accounts with an alias. */
    knownAccounts: Array<KnownAccountDto>;

    /** Representatives that run the Nano Node Monitor software (or some variant). */
    monitoredReps: Array<MonitoredRepresentativeDto>;

    /** Keeps track of how many pings a representative has been offline for. */
    offlinePingsMap: Map<string, number>;

    /** Online representatives. */
    onlineRepresentatives: string[];

    /** Online representatives, sorted by weight. */
    onlineRepresentativesWithWeights: { address: string; weight: number }[];

    /** Populated by CoinMarketCap API. */
    priceData: PriceDataDto;

    /** Top holders, sorted by balance. */
    richList: AccountBalanceDto[];

    /** Temporary data that is fetched, cached, and released over time. */
    temp: CacheClass<string, any> & { has: Function };

    /** Store delegator count */
    delegatorCount: Map<string, { total: number; funded: number }>;
};

export const AppCache: AppCache = {
    accountDistributionStats: undefined,
    historicHashes: new Map<string, number>(),
    knownAccounts: [],
    monitoredReps: [],
    offlinePingsMap: new Map<string, number>(),
    onlineRepresentatives: [],
    onlineRepresentativesWithWeights: [],
    priceData: undefined,
    richList: [],
    temp: new cache.Cache(),
    delegatorCount: new Map<string, { total: number; funded: number }>(),
};

AppCache.temp.has = (key: string): boolean => AppCache.temp.get(key) !== null;
