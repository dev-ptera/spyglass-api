export type BlockDto = {
    blockAccount: string;
    amount: number;
    amountRaw: string;
    balance: string;
    height: number;
    hash: string;
    timestamp: number;
    confirmed: boolean;
    subtype: 'send' | 'receive' | 'change';
    sourceAccount: string;
    contents: {
        type: 'state';
        account: string;
        previous: string;
        representative: string;
        balance: string;
        link: string;
        linkAsAccount: string;
        signature: string;
        work: string;
    };
};
