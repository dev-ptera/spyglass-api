import { isValidAddress, LOG_ERR } from '@app/services';
import { accountBlockCountRpc, accountHistoryRpc } from '@app/rpc';
import { InsightsDto } from '@app/types';
import { rawToBan } from 'banano-unit-converter';

const MAX_TRANSACTION_COUNT = 100_000;

type RequestBody = {
    address: string;
    includeBalanceHeights: boolean;
};

const DEFAULT_BODY: RequestBody = {
    address: '',
    includeBalanceHeights: false,
};

const setBodyDefaults = (body: RequestBody): void => {
    if (body.includeBalanceHeights === undefined) {
        body.includeBalanceHeights = DEFAULT_BODY.includeBalanceHeights;
    }
};

const createBlankDto = (): InsightsDto => ({
    heightBalances: [],
    maxAmountReceivedHash: undefined,
    maxAmountReceivedBan: 0,
    maxAmountSentHash: undefined,
    maxAmountSentBan: 0,
    maxBalanceHash: undefined,
    maxBalanceBan: 0,
    mostCommonRecipientAddress: undefined,
    mostCommonSenderAddress: undefined,
    mostCommonRecipientTxCount: 0,
    mostCommonSenderTxCount: 0,
    totalAmountReceivedBan: 0,
    totalAmountSentBan: 0,
    totalTxSent: 0,
    totalTxReceived: 0,
    firstInTxUnixTimestamp: undefined,
    firstInTxHash: undefined,
    firstOutTxUnixTimestamp: undefined,
    firstOutTxHash: undefined,
    lastInTxUnixTimestamp: undefined,
    lastInTxHash: undefined,
    lastOutTxUnixTimestamp: undefined,
    lastOutTxHash: undefined,
});

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

    let balance = 0;
    let index = 0;
    for (const transaction of accountHistory.history) {
        const isLastDp = index === accountHistory.history.length;
        let includePoint = false;
        if (transaction.amount) {
            const ban = Number(Number(rawToBan(transaction.amount)).toFixed(6));
            const addr = transaction.account;
            if (transaction['subtype'] === 'receive') {
                includePoint = true;
                balance += ban;
                if (!insightsDto.firstInTxHash) {
                    insightsDto.firstInTxHash = transaction.hash;
                    insightsDto.firstInTxUnixTimestamp = Number(transaction.local_timestamp);
                }
                insightsDto.lastInTxHash = transaction.hash;
                insightsDto.lastInTxUnixTimestamp = Number(transaction.local_timestamp);

                insightsDto.totalTxReceived += 1;
                insightsDto.totalAmountReceivedBan += ban;
                accountReceivedMap.has(addr)
                    ? accountReceivedMap.set(addr, accountReceivedMap.get(addr) + 1)
                    : accountReceivedMap.set(addr, 1);
                if (ban > insightsDto.maxAmountReceivedBan) {
                    insightsDto.maxAmountReceivedBan = ban;
                    insightsDto.maxAmountReceivedHash = transaction.hash;
                }
            } else if (transaction['subtype'] === 'send') {
                includePoint = true;
                balance -= ban;
                insightsDto.totalAmountSentBan += ban;
                if (!insightsDto.firstOutTxHash) {
                    insightsDto.firstOutTxHash = transaction.hash;
                    insightsDto.firstOutTxUnixTimestamp = Number(transaction.local_timestamp);
                }
                insightsDto.lastOutTxHash = transaction.hash;
                insightsDto.lastOutTxUnixTimestamp = Number(transaction.local_timestamp);
                insightsDto.totalTxSent += 1;
                accountSentMap.has(addr)
                    ? accountSentMap.set(addr, accountSentMap.get(addr) + 1)
                    : accountSentMap.set(addr, 1);
                if (ban > insightsDto.maxAmountSentBan) {
                    insightsDto.maxAmountSentBan = ban;
                    insightsDto.maxAmountSentHash = transaction.hash;
                }
            }
            if (balance >= insightsDto.maxBalanceBan) {
                insightsDto.maxBalanceBan = balance;
                insightsDto.maxBalanceHash = transaction.hash;
            }
        }
        if (includePoint || isLastDp) {
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
        .then((insights: InsightsDto) => {
            res.send(insights);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
