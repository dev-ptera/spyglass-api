export type BurnAccountsDto = {
    totalAmount: number;
    burnAccounts: BasicAccount[];
};

export type BasicAccount = {
    address: string;
    pending: number;
};
