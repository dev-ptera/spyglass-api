import {AccountAliasDto, getKnownAccountsPromise} from "@app/api";

export const getAccountAliases = async (req, res): Promise<AccountAliasDto[]> => {
    const knownAccounts = await getKnownAccountsPromise();
    const aliases: AccountAliasDto[] = [];
    for (const account of knownAccounts) {
        aliases.push({
            address: account.address,
            alias: account.alias
        })
    }
    res.send(aliases);
    return aliases;
};
