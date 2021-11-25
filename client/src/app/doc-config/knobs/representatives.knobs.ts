import { Knob } from './Knob';

export const REPRESENTATIVES_UPTIME_KNOBS: Array<Knob> = [
    {
        propertyName: 'representatives',
        propertyType: 'array',
    },
    {
        propertyName: 'includePings',
        propertyType: 'boolean',
    },
];

export const ROOT_REPRESENTATIVES_KNOBS: Array<Knob> = [
    {
        propertyName: 'addresses',
        propertyType: 'array',
    },
    {
        propertyName: 'includeDelegatorCount',
        propertyType: 'boolean',
    },
    {
        propertyName: 'includeNodeMonitorStats',
        propertyType: 'boolean',
        notes: 'Only applicable if a rep is running the Nano Node Monitor software',
    },
    {
        propertyName: 'includeAlias',
        propertyType: 'boolean',
    },
    {
        propertyName: 'includeUptimeStats',
        propertyType: 'boolean',
        notes: 'Only reps with >100K BAN weight will have uptime stats',
    },
    {
        propertyName: 'includeUptimePings',
        propertyType: 'boolean',
        notes: 'Only applicable when `includeUptimeStats` is enabled',
    },
    {
        propertyName: 'isOnline',
        propertyType: 'boolean',
    },
    {
        propertyName: 'isPrincipal',
        propertyType: 'boolean',
        notes: 'Only include representatives with >0.1% of the total online voting weight',
    },
    {
        propertyName: 'minimumWeight',
        propertyType: 'number',
        notes: 'Default of 10,000 & Minimum of 1,000',
    },
    {
        propertyName: 'maximumWeight',
        propertyType: 'number',
    },
];
