export type RepScoreDto = {
    address: string;
    alias?: string;
    isOnline: boolean;
    monitorStats?: {
        name: string;
        hasMinMemoryRequirement: boolean;
        hasAboveAvgCementedBlocks: boolean;
        hasBelowAvgUncheckedBlocks: boolean;
    };
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
