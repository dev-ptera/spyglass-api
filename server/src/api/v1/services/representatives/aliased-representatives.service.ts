import {NANO_CLIENT} from '@app/config';
import {LOG_INFO} from "@app/util";
import {AliasedRepresentativeDto, getKnownAccountsPromise, KnownAccountDto} from '@app/api';

export const getAliasedRepsPromise = async (knownAccounts: KnownAccountDto[]): Promise<AliasedRepresentativeDto[]> => {
    const rpcData = await NANO_CLIENT.representatives(5000, true);
    const repSet = new Set<string>();
    for (const rep in rpcData.representatives) {
        repSet.add(rep);
    }
    const aliasedReps: AliasedRepresentativeDto[] = [];
    knownAccounts.map((account) => {
        if (repSet.has(account.address)) {
            aliasedReps.push({
                address: account.address,
                alias: account.alias
            })
        }
    })
    return aliasedReps;
};

/** Returns a string array of online representative addresses. */
export const getAliasedRepresentatives = async (req, res): Promise<AliasedRepresentativeDto[]> => {
    const start = LOG_INFO('Updating Aliased Reps');
    const knownAccounts = await getKnownAccountsPromise();
    const aliases = await getAliasedRepsPromise(knownAccounts);
    res.send(aliases);
    LOG_INFO('Aliased Reps Updated', start);
    return aliases;
};
