export type NakamotoCoefficientDto = {
    delta: number;
    nakamotoCoefficient: number;
    ncRepresentatives: BasicRep[];
    ncRepsWeight: number;
};

export type BasicRep = {
    address: string;
    weight: number;
};
