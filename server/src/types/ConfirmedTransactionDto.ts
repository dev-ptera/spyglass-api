export type ConfirmedTransactionDto = {
    balanceRaw?: string;
    hash: string;
    type: 'receive' | 'send' | 'change';
    height: number;
    address?: string;
    timestamp: number;
    newRepresentative?: string;
};
