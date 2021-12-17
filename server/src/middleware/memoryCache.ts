import {AppCache, PATH_ROOT} from "@app/config";
import {LEDGER_SIZE_CACHE_KEY} from "../config/cache-keys";

const getCacheKey = (req): string => {
    const path = req.url.split(PATH_ROOT)[1];
    switch(path) {
        case '/network/ledger-size': {
            return LEDGER_SIZE_CACHE_KEY;
        }
        default: {
            //statements;
            break;
        }
    }
}

export const memCache = (req, res, next) => {
    const cached = AppCache.temp.get(getCacheKey(req));
    if (cached) {
        return res.send(cached);
    }
    next();
};
