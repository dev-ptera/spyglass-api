import { AppCache, NAKAMOTO_COEFFICIENT_CACHE_KEY, PATH_ROOT, QUORUM_CACHE_KEY } from '@app/config';
import { LEDGER_SIZE_CACHE_KEY } from '../config/cache-keys';

const getCacheKey = (req): string => {
    const path = req.url.split(PATH_ROOT)[1];
    switch (path) {
        case '/network/ledger-size': {
            return LEDGER_SIZE_CACHE_KEY;
        }
        case '/network/quorum': {
            return QUORUM_CACHE_KEY;
        }
        case '/network/nakamoto-coefficient': {
            return NAKAMOTO_COEFFICIENT_CACHE_KEY;
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
