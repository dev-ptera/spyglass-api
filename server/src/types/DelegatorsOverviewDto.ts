export type DelegatorsOverviewDto = {
    delegators: DelegatorDto[];
    count: number;
    withBalanceCount: number;
    weightSum: number;
};

export type DelegatorDto = {
    address: string;
    weight: number;
};
