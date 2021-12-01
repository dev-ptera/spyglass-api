export type NakamotoCoefficientDto = {
    delta: number;
    nakamotoCoefficient: number;
    ncRepresentatives: BasicRep[];
    ncRepsWeight: number;
};

type BasicRep = {
    address: string;
    weight: number;
};
