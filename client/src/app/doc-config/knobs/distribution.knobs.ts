import { Knob } from './Knob';

export const DISTRIBUTION_RICH_LIST_KNOBS: Array<Knob> = [
    {
        propertyName: 'includeRepresentative',
        propertyType: 'boolean',
        notes: 'Optionally include the representative for each account.',
    },
    {
        propertyName: 'offset',
        propertyType: 'number',
        required: true,
        defaultValue: 0,
        notes: 'Number of accounts to skip before returning results; used for pagination.',
    },
    {
        propertyName: 'size',
        propertyType: 'number',
        required: true,
        defaultValue: 50,
        notes: 'Number of records to return, with a default of 50 and max of 500.',
    },
];
