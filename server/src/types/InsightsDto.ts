export type InsightsDto = {
    blockCount: number;
    firstInTxUnixTimestamp: number;
    firstInTxHash: string;
    firstOutTxUnixTimestamp?: number;
    firstOutTxHash?: string;
    heightBalances?: Object;
    lastInTxUnixTimestamp: number;
    lastInTxHash: string;
    lastOutTxUnixTimestamp?: number;
    lastOutTxHash?: string;
    maxAmountReceivedHash: string;
    maxAmountReceived: number;
    maxAmountSentHash: string;
    maxAmountSent: number;
    maxBalanceHash: string;
    maxBalance: number;
    mostCommonSenderAddress: string;
    mostCommonSenderTxCount: number;
    mostCommonRecipientAddress?: string;
    mostCommonRecipientTxCount: number;
    totalAmountReceived: number;
    totalAmountSent: number;
    totalTxChange: number;
    totalTxReceived: number;
    totalTxSent: number;
};

export type InsightsDtoV2 = {
    blockCount: number;
    heightBalances?: Object;
    maxBalance: number;
    maxBalanceHash: string;
    changeStats: {
        totalTxChange: number;
    };
    receiveStats: {
        firstInTxUnixTimestamp: number;
        firstInTxHash: string;
        lastInTxUnixTimestamp: number;
        lastInTxHash: string;
        maxAmountReceivedHash: string;
        maxAmountReceived: number;
        mostCommonSenderAddress: string;
        mostCommonSenderTxCount: number;
        totalAmountReceived: number;
        totalTxReceived: number;
        totalTxSent: number;
        senders: Tx[];
    };
    sentStats: {
        firstOutTxUnixTimestamp: number;
        firstOutTxHash: string;
        lastOutTxUnixTimestamp: number;
        lastOutTxHash: string;
        maxAmountSentHash: string;
        maxAmountSent: number;
        mostCommonRecipientAddress: string;
        mostCommonRecipientTxCount: number;
        totalAmountSent: number;
        recipients: Tx[];
    };
};

type Tx = {
    address: string;
    count: number;
    amount: number;
};
