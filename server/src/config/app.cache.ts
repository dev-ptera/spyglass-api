import { KnownAccountDto, MonitoredRepresentativeDto } from '@app/types';

export type AppCache = {
    /** Representatives that run the Nano Node Monitor software. */
    monitoredReps: Array<MonitoredRepresentativeDto>;

    /** Accounts with an alias. */
    knownAccounts: Array<KnownAccountDto>;
};

export const AppCache: AppCache = {
    knownAccounts: [],
    monitoredReps: [],
};
