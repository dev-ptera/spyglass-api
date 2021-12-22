import { AliasedRepresentativeDto } from '@app/types';
import { filterKnownAccounts } from '@app/services';

/** Returns an array of aliased representative addresses. */
export const getAliasedReps = (): AliasedRepresentativeDto[] => {
    return filterKnownAccounts({ typeFilter: 'representative' });
};

/** Returns an array of aliased representative addresses. */
export const getAliasedRepresentativesV1 = (res): void => {
    res.send(getAliasedReps());
};
