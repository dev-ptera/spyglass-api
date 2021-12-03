export type InsightsDto = {
    amountChangedRep: number;
    heightBalances?: Datapoint[];
    maxAmountReceivedHash: string;
    maxAmountReceived: number;
    maxAmountSentHash: string;
    maxAmountSent: number;
    maxBalanceHash: string;
    maxBalance: number;
    mostCommonSenderAddress: string;
    mostCommonSenderTxCount: number;
    mostCommonRecipientAddress: string;
    mostCommonRecipientTxCount: number;
    totalAmountReceived: number;
    totalAmountSent: number;
    totalTxSent: number;
    totalTxReceived: number;
    firstInTxUnixTimestamp: number;
    firstInTxHash: string;
    firstOutTxUnixTimestamp: number;
    firstOutTxHash: string;
    lastInTxUnixTimestamp: number;
    lastInTxHash: string;
    lastOutTxUnixTimestamp: number;
    lastOutTxHash: string;
};

type Datapoint = {
    balance: number;
    height: number;
};
