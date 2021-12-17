import {
    AppCache,
    INSIGHTS_CACHE_PAIR,
    LEDGER_SIZE_CACHE_PAIR,
    NAKAMOTO_COEFFICIENT_CACHE_PAIR,
    PATH_ROOT,
    QUORUM_CACHE_PAIR,
} from '@app/config';
import {minutesToMs, secondsToMs} from '@app/services';

const getCacheKey = (req): string => {
    const path = req.url.split(PATH_ROOT)[1];
    switch (path) {
        case '/network/ledger-size': {
            return LEDGER_SIZE_CACHE_PAIR.key;
        }
        case '/network/quorum': {
            return QUORUM_CACHE_PAIR.key;
        }
        case '/network/nakamoto-coefficient': {
            return NAKAMOTO_COEFFICIENT_CACHE_PAIR.key;
        }
        case '/account/insights': {
            return `${INSIGHTS_CACHE_PAIR.key}/${req.body.address}`;
        }
        default: {
            //statements;
            break;
        }
    }
};

export const memCache = (req, res, next) => {
    const key = getCacheKey(req);
    const cached = AppCache.temp.get(key);
    if (cached) {
        console.log('sending cached results');
        return res.send(cached);
    }
    next();
};

export const determineDynamicCacheTime = (blockCount: number): number => {
    if (blockCount < 1000) {
        return secondsToMs(30);
    }
    if (blockCount < 10_000) {
        return minutesToMs(1);
    }
    if (blockCount < 100_000) {
        return minutesToMs(5);
    }
    if (blockCount < 1_000_000) {
        return minutesToMs(15);
    }
    if (blockCount < 10_000_000) {
        return minutesToMs(60);
    }
    if (blockCount < 100_000_000) {
        return minutesToMs(60);
    }
    return minutesToMs(60);
};
