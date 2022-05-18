import { minutesToMs, secondsToMs } from '@app/services';

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
