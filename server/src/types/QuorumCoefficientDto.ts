export type QuorumCoefficientDto = {
    delta: number;
    onlineWeight: number;
    onlineWeightMinimum: number;
    coefficient: number;
    representatives: BasicRep[];
    repsWeight: number;
};

type BasicRep = {
    address: string;
    weight: number;
};
