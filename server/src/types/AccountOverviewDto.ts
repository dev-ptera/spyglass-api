export type AccountOverviewDto = {
    opened: boolean;
    address: string;
    balanceRaw?: string;
    balance?: number;
    receivableRaw: string;
    receivable: number;
    blockCount: number;
    delegatorsCount: number;
    representative?: string;
    principal: boolean;

    /** I currently only know the weight for opened accounts. */
    weight?: number;
};
