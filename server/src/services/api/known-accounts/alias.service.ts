import { AccountAliasDto } from '@app/types';
import {AppCache} from "@app/config";

export const getAccountAliases = async (req, res): Promise<void> => {
    const knownAccounts = AppCache.knownAccounts;
    const aliases: AccountAliasDto[] = [];
    for (const account of knownAccounts) {
        aliases.push({
            address: account.address,
            alias: account.alias,
        });
    }
    res.send(aliases);
};
