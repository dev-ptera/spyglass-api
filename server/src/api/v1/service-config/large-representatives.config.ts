import {RequestBody} from "./RequestBody";

export const METHOD = 'POST';
export const PATH = 'representatives/large';

export type LargeRepresentativesRequestBody = {
    minimumWeight: number;
    maximumWeight: number;
    includeDelegatorCount: boolean;
};

export const DEFAULT_BODY: LargeRepresentativesRequestBody = {
    includeDelegatorCount: false,
    minimumWeight: 100_000,
    maximumWeight: undefined,
}

export const KNOBS: Array<RequestBody<LargeRepresentativesRequestBody>> = [
    {
        propertyName: 'includeDelegatorCount',
        propertyType: 'boolean',
        defaultValue: DEFAULT_BODY.includeDelegatorCount,
    },
    {
        propertyName: 'minimumWeight',
        propertyType: 'boolean',
        defaultValue: DEFAULT_BODY.minimumWeight,
        notes: 'Default of 100,000 & Minimum of 1000',
    },
    {
        propertyName: 'maximumWeight',
        propertyType: 'number',
        defaultValue: DEFAULT_BODY.maximumWeight,
    },
];
