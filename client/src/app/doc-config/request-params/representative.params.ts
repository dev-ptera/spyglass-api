import { RequestBodyParameters } from './index';

export const REPRESENTATIVES_LARGE: Array<RequestBodyParameters> = [
    {
        required: false,
        propertyName: 'minimumWeight',
        propertyType: 'number',
        defaultValue: undefined,
        notes: 'Minimum is 100 BAN weight',
    },
    {
        required: false,
        propertyName: 'delegatorCount',
        propertyType: 'boolean',
        defaultValue: undefined,
    },
];
