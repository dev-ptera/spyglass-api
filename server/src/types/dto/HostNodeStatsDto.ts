import { MonitoredRepDto } from '@app/types';

export type HostNodeStatsDto = MonitoredRepDto & {
    ledgerSizeMb: number;
    availableDiskSpaceGb: number;
};
