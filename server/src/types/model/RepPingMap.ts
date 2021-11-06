import { Ping } from './Ping';

export type RepPingMap = Map<string, RepPingMapData>;

export type RepPingMapData = {
    day: Ping[];
    week: Ping[];
    month: Ping[];
    semiAnnual: Ping[];
    year: Ping[];
};
