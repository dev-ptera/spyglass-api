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
    confirmedTransactions: ConfirmedTransactionDto[];
    pendingTransactions: ReceivableTransactionDto[];
    delegators: DelegatorDto[];
    delegatorsWeightSum: number;
};

type ConfirmedTransactionDto = {
    balanceRaw?: string;
    hash: string;
    type: 'receive' | 'send' | 'change';
    height: number;
    address?: string;
    timestamp: number;
    date: string;
    newRepresentative?: string;
};

type DelegatorDto = {
    address: string;
    weight: number;
};

type ReceivableTransactionDto = {
    balanceRaw: string;
    timestamp: number;
    hash: string;
    address: string;
};
