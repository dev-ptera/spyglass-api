import {
    AppCache,
    HOST_NODE_STATS_PAIR,
    INSIGHTS_CACHE_PAIR,
    LEDGER_SIZE_CACHE_PAIR,
    NAKAMOTO_COEFFICIENT_CACHE_PAIR,
    PATH_ROOT,
    QUORUM_CACHE_PAIR,
    REP_SCORES_CACHE_PAIR,
} from '@app/config';
import { minutesToMs, secondsToMs } from '@app/services';

const getCacheKey = (req): string => {
    const path = req.url.split(PATH_ROOT)[1];
    switch (path) {
        case '/v1/network/ledger-size': {
            return LEDGER_SIZE_CACHE_PAIR.key;
        }
        case '/v1/network/quorum': {
            // TODO: use path as key?  Export CachedRequests = { path: string, duration: number, dynamicPath?: (key) => string }
            return QUORUM_CACHE_PAIR.key;
        }
        case '/v1/network/nakamoto-coefficient': {
            return NAKAMOTO_COEFFICIENT_CACHE_PAIR.key;
        }
        case '/v1/network/node-stats': {
            return HOST_NODE_STATS_PAIR.key;
        }
        case '/v1/account/insights': {
            return `${INSIGHTS_CACHE_PAIR.key}/${req.body.address}`;
        }
        case '/v1/representatives/scores': {
            return REP_SCORES_CACHE_PAIR.key;
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
        return res.send(cached);
    }
    next();
};

/** Uses block count to determine how long to cache results. */
export const calcCacheDuration = (blockCount: number): number => {
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
