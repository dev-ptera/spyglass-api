import {Knob} from "./Knob";

export const LARGE_REPRESENTATIVES_KNOBS: Array<Knob> = [
    {
        propertyName: 'includeDelegatorCount',
        propertyType: 'boolean',
    },
    {
        propertyName: 'minimumWeight',
        propertyType: 'number',
        notes: 'Default of 100,000 & Minimum of 1000',
    },
    {
        propertyName: 'maximumWeight',
        propertyType: 'number',
    },
];
