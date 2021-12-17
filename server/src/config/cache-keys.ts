import { minutesToMs, secondsToMs } from '@app/services';

export type CachePair = { key: string; duration: number };

export const LEDGER_SIZE_CACHE_PAIR = {
    key: 'ledgerSize',
    duration: minutesToMs(10),
};

export const QUORUM_CACHE_PAIR = {
    key: 'quorum',
    duration: secondsToMs(15),
};

export const NAKAMOTO_COEFFICIENT_CACHE_PAIR = {
    key: 'nc',
    duration: secondsToMs(30),
};
