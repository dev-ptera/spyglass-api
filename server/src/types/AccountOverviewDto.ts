export type AccountOverviewDto = {
    opened: boolean;
    address: string;
    balanceRaw: string;
    pendingRaw: string;
    completedTxCount: number;
    pendingTxCount: number;
    delegatorsCount: number;
    representative: string;
    principal: boolean;
    confirmedTransactions: Array<{
        amount?: number;
        amountRaw?: string;
        hash: string;
        type: 'receive' | 'send' | 'change';
        height: number;
        address?: string;
        timestamp: number;
        date: string;
        newRepresentative?: string;
    }>;
    pendingTransactions: Array<{
        balanceRaw: string;
        timestamp: number;
        hash: string;
        address: string;
    }>;
    delegators: Array<{
        address: string;
        weight: number;
    }>;
    delegatorsWeightSum: number;
};



