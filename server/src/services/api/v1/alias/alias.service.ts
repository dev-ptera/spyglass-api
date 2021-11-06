import { AppCache } from '@app/config';
import { AliasDto } from '@app/types';

/** Uses the AppCache to return a section of all known accounts. */
export const getAliases = async (req, res) => {
    const aliases: AliasDto[] = [];
    for (const account of AppCache.knownAccounts) {
        aliases.push({
            addr: account.address,
            alias: account.alias,
        });
    }
    res.send(aliases);
};
