import { MonitoredRepresentativeDto } from './MonitoredRepresentativeDto';

export type RepresentativeDto = {
    address: string;
    weight: number;
    delegatorsCount?: number;
    nodeMonitorStats?: MonitoredRepresentativeDto;
    isOnline?: boolean;
    isPrincipal?: boolean;
    alias?: string;
};
