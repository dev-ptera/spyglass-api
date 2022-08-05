export type BlockAtHeightDto = {
    hash: string;
    block_account: string;
    amount: string;
    amount_decimal: string;
    balance: string;
    balance_decimal: string;
    height: string;
    local_timestamp: string;
    successor: string;
    confirmed: string;
    contents: {
        type: string;
        account: string;
        previous: string;
        representative: string;
        balance: string;
        balance_decimal: string;
        link: string;
        link_as_account: string;
        signature: string;
        work: string;
    };
    subtype: string;
    source_account: string;
};
