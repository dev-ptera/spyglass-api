import { KnownAccountDto } from '@app/types';
import { AppCache } from '@app/config';
import { accountBalancePromise } from '../account/account-overview.service';
import { LOG_ERR } from '../../log/error.service';
import { convertFromRaw, sleep } from '../../etc/generic-utils';

type RequestBody = {
    includeOwner?: boolean;
    includeType?: boolean;
    includeLore?: boolean;
    includeBalance?: boolean;
    typeFilter?: string;
};

const DEFAULT_BODY: RequestBody = {
    includeOwner: false,
    includeType: false,
    includeLore: false,
    includeBalance: false,
    typeFilter: '',
};

const setBodyDefaults = (body: RequestBody): void => {
    if (body.includeOwner === undefined) {
        body.includeOwner = DEFAULT_BODY.includeOwner;
    }
    if (body.includeType === undefined) {
        body.includeType = DEFAULT_BODY.includeType;
    }
    if (body.includeBalance === undefined) {
        body.includeBalance = DEFAULT_BODY.includeBalance;
    }
    if (body.includeLore === undefined) {
        body.includeLore = DEFAULT_BODY.includeLore;
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
    const body = req.body as RequestBody;
    setBodyDefaults(req.body);
    const accounts = filterKnownAccountsByType(body);
    const copied: KnownAccountDto[] = [];
    accounts.forEach((account) => {
        const copy: KnownAccountDto = {} as any;
        copy.address = account.address;
        copy.alias = account.alias;
        copy.lore = body.includeLore ? account.lore : undefined;
        copy.balance = body.includeBalance ? account.balance : undefined;
        copy.owner = body.includeOwner ? account.owner : undefined;
        copy.type = body.includeType ? account.type : undefined;
        copied.push(copy);
    });
    res.send(copied);
};

export const refreshKnownAccountBalances = async (): Promise<void> => {
    for (const knownAccount of AppCache.knownAccounts) {
        try {
            const response = await accountBalancePromise(knownAccount.address);
            knownAccount.balance = convertFromRaw(response.balance);
        } catch (err) {
            LOG_ERR('refreshKnownAccountBalances', err, { address: knownAccount.address });
        }
    }
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
