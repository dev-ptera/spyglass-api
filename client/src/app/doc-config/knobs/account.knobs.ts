import { Knob } from './Knob';

export const ACCOUNT_EXPORT_KNOBS: Array<Knob> = [
    {
        propertyName: 'address',
        propertyType: 'string',
    },
];
export const ACCOUNT_OVERVIEW_KNOBS: Array<Knob> = [
    {
        propertyName: 'address',
        propertyType: 'string',
        restPathAlias: '[address]',
    },
];

export const ACCOUNT_RECEIVABLE_KNOB: Array<Knob> = [
    {
        propertyName: 'address',
        propertyType: 'string',
    },
    {
        propertyName: 'offset',
        propertyType: 'number',
        notes: 'Skips the specified number of records in the result set. Used for pagination.',
    },
    {
        propertyName: 'size',
        propertyType: 'number',
        notes: 'Number of delegators to return. Defaults to show 50 receivable transactions with a max of 500.',
    },
];

export const ACCOUNT_INSIGHTS_KNOB: Array<Knob> = [
    {
        propertyName: 'address',
        propertyType: 'string',
        restPathAlias: '[address]',
    },
    {
        propertyName: 'includeHeightBalances',
        propertyType: 'boolean',
    },
];

export const ACCOUNT_REPRESENTATIVE_KNOB: Array<Knob> = [
    {
        propertyName: 'address',
        propertyType: 'string',
        restPathAlias: '[address]',
    },
];

export const ACCOUNT_DELEGATORS_KNOB: Array<Knob> = [
    {
        propertyName: 'address',
        propertyType: 'string',
        required: true,
    },
    {
        propertyName: 'offset',
        propertyType: 'number',
        notes: 'Skips the specified number of records in the result set. Used for pagination.',
    },
    {
        propertyName: 'size',
        propertyType: 'number',
        notes: 'Number of delegators to return. Defaults to show 100 delegators.',
    },
    {
        propertyName: 'threshold',
        propertyType: 'number',
        notes: 'Minimum required balance for a delegator to be included in the response. This not in raw. Defaults to 0.0001.',
    },
];

export const ACCOUNT_CONFIRMED_KNOB: Array<Knob> = [
    {
        propertyName: 'address',
        propertyType: 'string',
    },
    {
        propertyName: 'filterAddresses',
        propertyType: 'array',
        notes: 'Only show transactions where these addresses were either the sender, recipient, or new representative',
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
        propertyName: 'maxAmount',
        propertyType: 'number',
        notes: 'Maximum number of required to included (not raw)',
    },
    {
        propertyName: 'minAmount',
        propertyType: 'number',
        notes: 'Minimum number of required to included (not raw)',
    },
    {
        propertyName: 'offset',
        propertyType: 'number',
        notes: 'Results will be returned starting from this block height',
    },
    {
        propertyName: 'size',
        propertyType: 'number',
        notes: 'Max number of blocks to return; defaults to include 25 with a max of 500',
    },
];
