export type RepScoreDto = {
    address: string;
    alias?: string;
    online: boolean;
    daysAge: number;
    monitorStats?: {
        name: string;
        hasMinMemoryRequirement: boolean;
        hasAboveAvgCementedBlocks: boolean;
        hasBelowAvgUncheckedBlocks: boolean;
    };
    principal: boolean;
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
