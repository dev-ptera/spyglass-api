import { Knob } from './Knob';

export const KNOWN_ACCOUNTS_KNOBS: Array<Knob> = [
    {
        propertyName: 'includeOwner',
        propertyType: 'boolean',
    },
    {
        propertyName: 'includeType',
        propertyType: 'boolean',
    },
    {
        propertyName: 'typeFilter',
        propertyType: 'string',
    },
];
