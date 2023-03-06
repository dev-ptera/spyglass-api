import { KnownAccountDto } from '@app/types';
import { AppCache } from '@app/config';

type RequestBody = {
    includeOwner?: boolean;
    includeType?: boolean;
    includeLore?: boolean;
    typeFilter?: string;
};

const DEFAULT_BODY: RequestBody = {
    includeOwner: false,
    includeType: false,
    includeLore: false,
    typeFilter: '',
};

const setBodyDefaults = (body: RequestBody): void => {
    if (body.includeOwner === undefined) {
        body.includeOwner = DEFAULT_BODY.includeOwner;
    }
    if (body.includeType === undefined) {
        body.includeType = DEFAULT_BODY.includeType;
    }
    if (body.typeFilter === undefined) {
        body.typeFilter = DEFAULT_BODY.typeFilter;
    }
};

const getFilterType = (body: RequestBody): string => {
    if (body && body.typeFilter) {
        return body.typeFilter.toLowerCase().trim();
    }
    return undefined;
};

export const filterKnownAccountsByType = (body: RequestBody): KnownAccountDto[] => {
    const filter = getFilterType(body);
    return filter ? AppCache.knownAccounts.filter((account) => account.type === filter) : AppCache.knownAccounts;
};

/** Returns a list of accounts that are known on the network (exchanges, representatives, funds, etc). */
export const getKnownAccountsV1 = (req, res): void => {
    console.log(AppCache.knownAccounts);
    const body = req.body as RequestBody;
    setBodyDefaults(req.body);
    const accounts = filterKnownAccountsByType(body);
    res.send(accounts);
};

export const getKnownAccountLoreV1 = (req, res): void => {
    const parts = req.url.split('/');
    const address = parts[parts.length - 1];
    const knownAccount = AppCache.knownAccounts.filter((account) => account.address === address)[0];
    if (knownAccount) {
        res.send({ lore: knownAccount.lore });
    }
    res.status(404).send();
};
