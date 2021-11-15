import { MonitoredRepresentativeDto } from './MonitoredRepresentativeDto';
import { RepresentativeUptimeDto } from './RepresentativeUptimeDto';

export type RepresentativeDto = {
    address: string;
    weight: number;
    delegatorsCount?: number;
    nodeMonitorStats?: MonitoredRepresentativeDto;
    isOnline?: boolean;
    isPrincipal?: boolean;
    alias?: string;
    uptimeStats?: RepresentativeUptimeDto;
};
