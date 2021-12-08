export type ConfirmedTransactionDto = {
    amount?: number;
    amountRaw?: string;
    hash: string;
    type: 'receive' | 'send' | 'change';
    height: number;
    address?: string;
    timestamp: number;
    date: string;
    newRepresentative?: string;
};
