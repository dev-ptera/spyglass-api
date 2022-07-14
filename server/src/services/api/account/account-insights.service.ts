import { convertFromRaw, getAccurateHashTimestamp, getTransactionType, isValidAddress, LOG_ERR } from '@app/services';
import { accountBlockCountRpc } from '@app/rpc';
import { InsightsDto } from '@app/types';
import { Subject } from 'rxjs';
import { iterateHistory, IterateHistoryConfig, RpcConfirmedTransaction } from './account-history.service';

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
    blockCount: 0,
    firstInTxHash: undefined,
    firstInTxUnixTimestamp: undefined,
    firstOutTxHash: undefined,
    firstOutTxUnixTimestamp: undefined,
    heightBalances: {},
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
    totalTxChange: 0,
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

/** Given an insights dto, prunes height balances if user did not request them. */
const formatHeightBalances = (data: InsightsDto, includeHeightBalances: boolean): InsightsDto => {
    const clone = Object.assign({}, data);
    if (!includeHeightBalances) {
        clone.heightBalances = undefined;
    }
    return clone;
};

/** Fetches account history in 10_000 transaction increments, tracking balance & sender/receiver info. */
const gatherInsights = async (address: string): Promise<InsightsDto> => {
    let balance = 0;
    let height = 0;
    const insightsDto = createBlankDto();
    const accountSentMap = new Map<string, number>();
    const accountReceivedMap = new Map<string, number>();
    const iterationSettings: IterateHistoryConfig = {
        address,
        reverse: true,
    };

    await iterateHistory(iterationSettings, (transaction: RpcConfirmedTransaction) => {
        insightsDto.blockCount++;

        // Send incremental updates to the client.  Every 10K transactions counted.
        if (insightsDto.blockCount % 10_000 === 0) {
            const sockets = Array.from(websocketProgressMap.get(address) || []);
            sockets.map((ws) => {
                ws.send(String(insightsDto.blockCount));
            });
        }

        const type = getTransactionType(transaction);

        // Count Change Blocks
        if (!transaction.amount) {
            if (type === 'change') {
                insightsDto.totalTxChange++;
            }
            return;
        }

        // Count Send / Receive Blocks & aggregate balances.
        const amount = convertFromRaw(transaction.amount, 6);
        if (type === 'receive') {
            balance += amount;
            handleReceiveTransaction(insightsDto, transaction, amount, accountReceivedMap);
        } else if (type === 'send') {
            balance -= amount;
            handleSendTransaction(insightsDto, transaction, amount, accountSentMap);
        }

        // Audit max balance
        if (balance >= insightsDto.maxBalance) {
            insightsDto.maxBalance = balance;
            insightsDto.maxBalanceHash = transaction.hash;
        }

        // Append new block to the list (change blocks are omitted.)
        height = Number(transaction.height);
        insightsDto.heightBalances[height] = Number(balance.toFixed(8));
    });

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

// A map of pending requests.  If a request is already in progress, do not re-iterate the account's history; instead subscribe and listen until the original request has ended.
const activeInsightsRequests = new Map<string, Subject<InsightsDto>>();

// A map of pending requests that have websocket listeners.
const websocketProgressMap = new Map<string, Set<WebSocket>>();

const confirmedTransactionsPromise = async (body: RequestBody, ws?: WebSocket): Promise<InsightsDto> => {
    setBodyDefaults(body);
    const address = body.address;

    if (!isValidAddress(address)) {
        return Promise.reject({ error: 'Address is required' });
    }

    const blockCountResponse = await accountBlockCountRpc(address).catch((err) =>
        Promise.reject(LOG_ERR('getAccountInsights.accountBlockCountRpc', err, { address }))
    );

    const blockCount = Number(blockCountResponse.block_count);
    if (blockCount > MAX_TRANSACTION_COUNT) {
        return Promise.reject({ error: 'Account has too many transactions to perform insights.' });
    }

    // If a duplicated request has been received, listen for the emitted resulted.
    if (activeInsightsRequests.has(address)) {
        return new Promise((resolve) => {
            addProgressWebsocket(address, ws);
            activeInsightsRequests.get(address).subscribe((data) => {
                removeProgressWebsocket(address, ws);
                resolve(formatHeightBalances(data, body.includeHeightBalances));
            });
        });
    }
    ``;

    // Otherwise, iterate account balances, emit result when complete.
    const requestFinishedSubject = new Subject<InsightsDto>();
    activeInsightsRequests.set(address, requestFinishedSubject);
    try {
        addProgressWebsocket(address, ws);
        const data = await gatherInsights(address);
        requestFinishedSubject.next(data);
        return formatHeightBalances(data, body.includeHeightBalances);
    } catch (err) {
        LOG_ERR('iterateAccountHistory', err);
    } finally {
        // requestFinishedSubject.next(data);
        // TODO: Handle error here where the original request never finishes.  Currently listeners wait forever until refresh.
        activeInsightsRequests.delete(address);
        removeProgressWebsocket(address, ws);
    }
};

const addProgressWebsocket = (address: string, ws?: WebSocket): void => {
    websocketProgressMap.has(address)
        ? websocketProgressMap.get(address).add(ws)
        : websocketProgressMap.set(address, new Set([ws]));
};

const removeProgressWebsocket = (address: string, ws?: WebSocket): void => {
    websocketProgressMap.get(address).delete(ws);
};

/** Given an account address, it will return chart datapoints that represent that account's balance over time,
 *  as well as account-specific stats for most all-time balance, most common sender, etc.
 */
export const getAccountInsightsV1 = (req, res): void => {
    confirmedTransactionsPromise(req.body)
        .then((data) => res.send(data))
        .catch((err) => res.status(500).send(err));
};

export const getAccountInsightsWSV1 = async (msg, ws): Promise<void> => {
    if (!msg) {
        return;
    }

    try {
        const body = JSON.parse(msg);
        const data = await confirmedTransactionsPromise(body, ws);
        ws.send(JSON.stringify(data));
    } catch (err) {
        LOG_ERR('getAccountInsightsWSV1', err);
    }
};
