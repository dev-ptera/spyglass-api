import { RequestBodyParameters } from './index';

export const REPRESENTATIVES_ROOT: Array<RequestBodyParameters> = [
    {
        required: false,
        propertyName: 'includeDelegatorCount',
        propertyType: 'boolean',
        defaultValue: undefined,
    },
    {
        required: false,
        propertyName: 'includeNodeMonitorStats',
        propertyType: 'boolean',
        defaultValue: undefined,
    },
    {
        required: false,
        propertyName: 'includeUptimeStats',
        propertyType: 'boolean',
        defaultValue: undefined,
    },
    {
        required: false,
        propertyName: 'isOnline',
        propertyType: 'boolean',
        defaultValue: undefined,
    },
    {
        required: false,
        propertyName: 'isPrincipal',
        propertyType: 'boolean',
        defaultValue: undefined,
    },
    {
        required: false,
        propertyName: 'minimumWeight',
        propertyType: 'number',
        defaultValue: undefined,
        notes: 'Default of 100,000 & Minimum of 1000',
    },
    {
        required: false,
        propertyName: 'maximumWeight',
        propertyType: 'number',
        defaultValue: undefined,
    },
];

export const REPRESENTATIVES_LARGE: Array<RequestBodyParameters> = [
    {
        required: false,
        propertyName: 'includeDelegatorCount',
        propertyType: 'boolean',
        defaultValue: undefined,
    },
    {
        required: false,
        propertyName: 'minimumWeight',
        propertyType: 'number',
        defaultValue: undefined,
        notes: 'Default of 100,000 & Minimum of 1000',
    },
    {
        required: false,
        propertyName: 'maximumWeight',
        propertyType: 'number',
        defaultValue: undefined,
    },
];
