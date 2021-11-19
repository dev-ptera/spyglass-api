import { Knob } from './Knob';

export const ACCOUNT_DELEGATORS_KNOB: Array<Knob> = [
    {
        propertyName: 'address',
        propertyType: 'string',
        restPathAlias: '[address]',
    },
];

export const ACCOUNT_CONFIRMED_TX_KNOB = ACCOUNT_DELEGATORS_KNOB;
