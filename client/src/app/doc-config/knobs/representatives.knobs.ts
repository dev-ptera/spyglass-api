import { Knob } from './Knob';

export const REPRESENTATIVES_UPTIME_KNOBS: Array<Knob> = [
    {
        propertyName: 'includePings',
        propertyType: 'boolean',
    },
    {
        propertyName: 'representatives',
        propertyType: 'array',
    },
];

export const ROOT_REPRESENTATIVES_KNOBS: Array<Knob> = [
    {
        propertyName: 'addresses',
        propertyType: 'array',
        notes: 'Limit search results to this list of addresses',
    },
    {
        propertyName: 'includeAlias',
        propertyType: 'boolean',
    },
    {
        propertyName: 'includeDelegatorCount',
        propertyType: 'boolean',
    },
    {
        propertyName: 'includeNodeMonitorStats',
        propertyType: 'boolean',
        notes: 'Only applicable to monitored representatives',
    },
    {
        propertyName: 'includeUptimePings',
        propertyType: 'boolean',
        notes: 'Append raw data used to calculate ping stats; only applicable when `includeUptimeStats` is enabled',
    },
    {
        propertyName: 'includeUptimeStats',
        propertyType: 'boolean',
        notes: 'Only reps with >10K BAN weight will have uptime stats available',
    },
    {
        propertyName: 'isMonitored',
        propertyType: 'boolean',
        notes: 'Filter to only show monitored representatives',
    },
    {
        propertyName: 'isOnline',
        propertyType: 'boolean',
        notes: 'Filter to only show online representatives',
    },
    {
        propertyName: 'isPrincipal',
        propertyType: 'boolean',
        notes: 'Filter to only show representatives with >0.1% of the total online voting weight',
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
    {
        propertyName: 'uptimeThresholdDay',
        propertyType: 'number',
        notes: 'Filter to only show representatives with an uptime that exceeds this percentage.  Only applicable when includeUptimeStats is enabled.',
    },
    {
        propertyName: 'uptimeThresholdWeek',
        propertyType: 'number',
    },
    {
        propertyName: 'uptimeThresholdMonth',
        propertyType: 'number',
    },
    {
        propertyName: 'uptimeThresholdSemiAnnual',
        propertyType: 'number',
    },
    {
        propertyName: 'uptimeThresholdYear',
        propertyType: 'number',
    },
];
