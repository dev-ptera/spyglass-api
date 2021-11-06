import { RepresentativeUptimeDto } from './RepresentativeUptimeDto';

export type RepresentativeDto = {
    address: string;
    weight: number;
    online: boolean;
    principal: boolean;
    delegatorsCount: number;
} & RepresentativeUptimeDto;
