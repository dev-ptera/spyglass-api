import { Knob } from './Knob';

export const ACCOUNT_REPRESENTATIVE_KNOB: Array<Knob> = [
{
    propertyName: 'address',
    propertyType: 'string',
    restPathAlias: '[address]',
}];

export const ACCOUNT_DELEGATORS_KNOB: Array<Knob> = [
    {
        propertyName: 'address',
        propertyType: 'string',
        required: true,
    },
    {
        propertyName: 'count',
        propertyType: 'number',
        notes: 'Number of delegators to return. Defaults to show 100 delegators.',
    },
   /* {
        propertyName: 'offset',
        propertyType: 'number',
        notes: 'Skips the specified number of records in the result set. Used for pagination.',
    }, */
    {
        propertyName: 'threshold',
        propertyType: 'number',
        notes: 'Minimum required balance for a delegator to be included in the response. This not in raw. Defaults to 0.0001.',
    },
];

export const ACCOUNT_HISTORY_KNOB: Array<Knob> = [
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
        notes: 'Defaults to include 25 transactions, with a max of 500',
    },
    {
        propertyName: 'offset',
        propertyType: 'number',
        notes: 'Results will be returned starting from this block height',
    },
];
