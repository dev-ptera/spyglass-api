import {Knob} from "./Knob";

export const LARGE_REPRESENTATIVES_KNOBS: Array<Knob> = [
    {
        propertyName: 'includeDelegatorCount',
        propertyType: 'boolean',
    },
    {
        propertyName: 'minimumWeight',
        propertyType: 'number',
        notes: 'Default of 100,000 & Minimum of 1000',
    },
    {
        propertyName: 'maximumWeight',
        propertyType: 'number',
    },
];

export const ROOT_REPRESENTATIVES_KNOBS: Array<Knob> = [
    {
        propertyName: 'includeDelegatorCount',
        propertyType: 'boolean',
    },
    {
        propertyName: 'includeNodeMonitorStats',
        propertyType: 'boolean',
    },
    {
        propertyName: 'includeUptimeStats',
        propertyType: 'boolean',
    },
    {
        propertyName: 'isOnline',
        propertyType: 'boolean',
    },
    {
        propertyName: 'isPrincipal',
        propertyType: 'boolean',
    },
    {
        propertyName: 'minimumWeight',
        propertyType: 'number',
        notes: 'Default of 100,000 & Minimum of 1000',
    },
    {
        propertyName: 'maximumWeight',
        propertyType: 'number',
    },
];
