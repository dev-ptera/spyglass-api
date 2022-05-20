export type DelegatorsOverviewDto = {
    delegators: DelegatorDto[];
    count: number;
    fundedCount: number;
    emptyCount: number;
    weightSum: number;
};

export type DelegatorDto = {
    address: string;
    weight: number;
};
