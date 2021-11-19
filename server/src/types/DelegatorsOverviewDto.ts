export type DelegatorsOverviewDto = {
    delegators: DelegatorDto[];
    count: number;
    weightSum: number;
};

export type DelegatorDto = {
    address: string;
    weight: number;
};
