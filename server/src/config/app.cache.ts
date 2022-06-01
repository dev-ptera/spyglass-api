import {
    AccountBalanceDto,
    AccountDistributionStatsDto,
    KnownAccountDto,
    MonitoredRepresentativeDto,
    PriceDataDto,
    RepScoreDto,
} from '@app/types';
import { CacheClass } from 'memory-cache';
import { minutesToMs, PingDoc } from '@app/services';

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

    /** Stores representative scores. */
    representativeScores: RepScoreDto[];

    /** Stores representative uptime metrics in memory to reduce number of file reads. */
    pingDocMap: Map<string, PingDoc>;
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
    representativeScores: [],
    pingDocMap: new Map<string, PingDoc>(),
};

AppCache.temp.has = (key: string): boolean => AppCache.temp.get(key) !== null;

export type CachePair = { key: string; duration: number };

export const LEDGER_SIZE_CACHE_PAIR = {
    key: 'ledgerSize',
    duration: minutesToMs(5),
};

export const QUORUM_CACHE_PAIR = {
    key: 'quorum',
    duration: minutesToMs(1),
};

export const HOST_NODE_STATS_PAIR = {
    key: 'hostNodeStats',
    duration: minutesToMs(1),
};

export const NAKAMOTO_COEFFICIENT_CACHE_PAIR = {
    key: 'nc',
    duration: minutesToMs(1),
};

// Move me to AppCache & refresh every minute.
export const REP_SCORES_CACHE_PAIR = {
    key: 'scores',
    duration: minutesToMs(1),
};

export const INSIGHTS_CACHE_PAIR = {
    key: 'account_insights',
    duration: undefined, // dynamic size
};
