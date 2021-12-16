import { convertFromRaw, getAccurateHashTimestamp, isValidAddress, LOG_ERR } from '@app/services';
import { accountBlockCountRpc, accountHistoryRpc } from '@app/rpc';
import { InsightsDto } from '@app/types';

const MAX_TRANSACTION_COUNT = 100_000;

type RequestBody = {
    address: string;
    includeHeightBalances: boolean;
};

const DEFAULT_BODY: RequestBody = {
    address: '',
    includeHeightBalances: false,
};

const setBodyDefaults = (body: RequestBody): void => {
    if (body.includeHeightBalances === undefined) {
        body.includeHeightBalances = DEFAULT_BODY.includeHeightBalances;
    }
};

const createBlankDto = (): InsightsDto => ({
    amountChangedRep: 0,
    firstInTxHash: undefined,
    firstInTxUnixTimestamp: undefined,
    firstOutTxHash: undefined,
    firstOutTxUnixTimestamp: undefined,
    heightBalances: [],
    lastInTxHash: undefined,
    lastInTxUnixTimestamp: undefined,
    lastOutTxHash: undefined,
    lastOutTxUnixTimestamp: undefined,
    maxAmountReceived: 0,
    maxAmountReceivedHash: undefined,
    maxAmountSent: 0,
    maxAmountSentHash: undefined,
    maxBalance: 0,
    maxBalanceHash: undefined,
    mostCommonRecipientAddress: undefined,
    mostCommonRecipientTxCount: 0,
    mostCommonSenderAddress: undefined,
    mostCommonSenderTxCount: 0,
    totalAmountReceived: 0,
    totalAmountSent: 0,
    totalTxReceived: 0,
    totalTxSent: 0,
});

const handleReceiveTransaction = (
    insightsDto: InsightsDto,
    transaction,
    amount: number,
    accountReceivedMap: Map<string, number>
): void => {
    const sender = transaction.account;
    insightsDto.totalTxReceived += 1;
    insightsDto.totalAmountReceived += amount;

    if (!insightsDto.firstInTxHash) {
        insightsDto.firstInTxHash = transaction.hash;
        insightsDto.firstInTxUnixTimestamp = getAccurateHashTimestamp(transaction.hash, transaction.local_timestamp);
    }
    insightsDto.lastInTxHash = transaction.hash;
    insightsDto.lastInTxUnixTimestamp = getAccurateHashTimestamp(transaction.hash, transaction.local_timestamp);

    const count = accountReceivedMap.get(sender) || 0;
    accountReceivedMap.set(sender, count + 1);

    if (amount > insightsDto.maxAmountReceived) {
        insightsDto.maxAmountReceived = amount;
        insightsDto.maxAmountReceivedHash = transaction.hash;
    }
};

const handleSendTransaction = (
    insightsDto: InsightsDto,
    transaction,
    amount: number,
    accountSentMap: Map<string, number>
): void => {
    const recipient = transaction.account;
    insightsDto.totalTxSent += 1;
    console.log(amount);
    insightsDto.totalAmountSent += amount;
    if (!insightsDto.firstOutTxHash) {
        insightsDto.firstOutTxHash = transaction.hash;
        insightsDto.firstOutTxUnixTimestamp = getAccurateHashTimestamp(transaction.hash, transaction.local_timestamp);
    }
    insightsDto.lastOutTxHash = transaction.hash;
    insightsDto.lastOutTxUnixTimestamp = getAccurateHashTimestamp(transaction.hash, transaction.local_timestamp);

    const count = accountSentMap.get(recipient) || 0;
    accountSentMap.set(recipient, count + 1);

    if (amount > insightsDto.maxAmountSent) {
        insightsDto.maxAmountSent = amount;
        insightsDto.maxAmountSentHash = transaction.hash;
    }
};

const confirmedTransactionsPromise = async (body: RequestBody): Promise<InsightsDto> => {
    setBodyDefaults(body);
    const address = body.address;

    if (!isValidAddress(address)) {
        return Promise.reject({ error: 'Address is required' });
    }

    const blockCountResponse = await accountBlockCountRpc(address).catch((err) =>
        Promise.reject(LOG_ERR('getAccountInsights.accountBlockCountRpc', err, { address }))
    );

    if (Number(blockCountResponse.block_count) > MAX_TRANSACTION_COUNT) {
        return Promise.reject({ error: 'Account has too many transactions to perform insights.' });
    }

    const accountHistory = await accountHistoryRpc(address, 0, -1, true).catch((err) =>
        Promise.reject(LOG_ERR('getAccountInsights.accountHistoryRpc', err, { address }))
    );

    /* Map of <recipient address, balance> for each account a given `address` has interacted with. */
    const accountSentMap = new Map<string, number>();
    const accountReceivedMap = new Map<string, number>();
    const insightsDto = createBlankDto();

    if (!body.includeHeightBalances) {
        insightsDto.heightBalances = undefined;
    }

    /* Iterate through the list of transactions, perform insight calculations. */
    let balance = 0;
    for (const transaction of accountHistory.history) {
        // Count Change Blocks
        if (!transaction.amount) {
            if (transaction['subtype'] === 'change') {
                insightsDto.amountChangedRep++;
            }
            continue;
        }

        // Count Send / Receive Blocks & aggregate balances.
        const amount = convertFromRaw(transaction.amount, 6);
        if (transaction['subtype'] === 'receive') {
            balance += amount;
            handleReceiveTransaction(insightsDto, transaction, amount, accountReceivedMap);
        } else if (transaction['subtype'] === 'send') {
            balance -= amount;
            handleSendTransaction(insightsDto, transaction, amount, accountSentMap);
        }

        // Audit max balance
        if (balance >= insightsDto.maxBalance) {
            insightsDto.maxBalance = balance;
            insightsDto.maxBalanceHash = transaction.hash;
        }

        // Append new block to the list (change blocks are omitted.)
        if (body.includeHeightBalances) {
            const height = Number(transaction.height);
            const roundedBalance = balance > 100 ? Math.round(balance) : balance;
            insightsDto.heightBalances.push({ balance: Number(roundedBalance.toFixed(3)), height });
        }
    }

    // Set most common sender/recipient.
    let accountMaxSentCount = 0; // Calc Recipient Data
    for (const key of accountSentMap.keys()) {
        if (accountSentMap.get(key) > accountMaxSentCount) {
            accountMaxSentCount = accountSentMap.get(key);
            insightsDto.mostCommonRecipientAddress = key;
            insightsDto.mostCommonRecipientTxCount = accountMaxSentCount;
        }
    }
    let accountMaxReceivedCount = 0; // Calc Sender/Received Data
    for (const key of accountReceivedMap.keys()) {
        if (accountReceivedMap.get(key) > accountMaxReceivedCount) {
            accountMaxReceivedCount = accountReceivedMap.get(key);
            insightsDto.mostCommonSenderAddress = key;
            insightsDto.mostCommonSenderTxCount = accountMaxReceivedCount;
        }
    }
    return insightsDto;
};

/** Given an account address, it will return chart datapoints that represent that account's balance over time,
 *  as well as account-specific stats for most all-time balance, most common sender, etc.
 */
export const getAccountInsights = (req, res): void => {
    confirmedTransactionsPromise(req.body)
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
