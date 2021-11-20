import { Knob } from './Knob';

export const ACCOUNT_DELEGATORS_KNOB: Array<Knob> = [
    {
        propertyName: 'address',
        propertyType: 'string',
        restPathAlias: '[address]',
    },
];

export const ACCOUNT_CONFIRMED_TX_KNOB: Array<Knob> = [
    {
        propertyName: 'address',
        propertyType: 'string',
    },
    {
        propertyName: 'includeChange',
        propertyType: 'boolean',
        defaultValue: true,
    },
    {
        propertyName: 'includeReceive',
        propertyType: 'boolean',
        defaultValue: true,
    },
    {
        propertyName: 'includeSend',
        propertyType: 'boolean',
        defaultValue: true,
    },
    {
        propertyName: 'resultSize',
        propertyType: 'number',
        notes: 'Defaults to include 25 transactions, with a max of 100',
    },
    {
        propertyName: 'offset',
        propertyType: 'number',
        notes: 'Results will be returned starting from this block height',
    },
];
