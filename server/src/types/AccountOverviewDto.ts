import { ConfirmedTransactionDto } from './ConfirmedTransactionDto';
import { DelegatorDto } from './DelegatorsOverviewDto';
import { ReceivableTransactionDto } from './ReceivableTransactionDto';

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
