import { ConfirmedTransactionDto } from './ConfirmedTransactionDto';
import { PendingTransactionDto } from './PendingTransactionDto';
import { DelegatorDto } from './DelegatorDto';

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
    pendingTransactions: PendingTransactionDto[];
    delegators: DelegatorDto[];
    delegatorsWeightSum: number;
};
