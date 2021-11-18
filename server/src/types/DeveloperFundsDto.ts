export type DeveloperFundsDto = {
    totalBalance: number;
    wallets: {
        address: string;
        balance: number;
    }[];
};
