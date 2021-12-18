export type RepScoreDto = {
    address: string;
    isOnline: boolean;
    monitorStats?: {
        hasMinMemoryRequirement: boolean;
        hasAboveAvgCementedBlocks: boolean;
        hasAboveAvgUncheckedBlocks: boolean;
    }
    isPrincipal: boolean;
    weight: number;
    weightPercentage: number;
    score: number;

    uptimePercentages?: {
        day: number;
        week: number;
        month: number;
        semiAnnual: number;
        year: number;
    };
};
