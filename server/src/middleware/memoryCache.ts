import {
    AppCache,
    LEDGER_SIZE_CACHE_PAIR,
    NAKAMOTO_COEFFICIENT_CACHE_PAIR,
    PATH_ROOT,
    QUORUM_CACHE_PAIR,
} from '@app/config';

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
        default: {
            //statements;
            break;
        }
    }
};

export const memCache = (req, res, next) => {
    const cached = AppCache.temp.get(getCacheKey(req));
    if (cached) {
        console.log('sending cached results');
        return res.send(cached);
    }
    next();
};
