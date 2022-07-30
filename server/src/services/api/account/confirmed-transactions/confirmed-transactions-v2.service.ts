import { accountBlockCountRpc } from '@app/rpc';
import { convertFromRaw, isValidAddress, LOG_ERR } from '@app/services';
import { ConfirmedTransactionDto } from '@app/types';
import { AccountHistoryResponse, Subtype } from '@dev-ptera/nano-node-rpc/dist/types/rpc-response';
import { iterateHistory, IterateHistoryConfig, RpcConfirmedTransaction } from '../account-history.service';

const SUBTYPE = {
    change: 'change',
    receive: 'received',
    send: 'send',
};

type RequestBody = {
    // Address to search
    address: string;
    // Include send blocks
    includeSend?: boolean;
    // Include Receive blocks
    includeReceive?: boolean;
    // Include Change blocks
    includeChange?: boolean;
    // Only include these addresses in the result set
    filterAddresses?: string[];
    // Ignore these addresses in the result set
    excludedAddresses?: string[];
    // Transactions must meet this amount or greater (BAN)
    minAmount?: number;
    // Transactions must be less than this amount (BAN)
    maxAmount?: number;
    // Transaction height must exceed this block height
    minBlock?: number,
    // Transaction height must not exceed this block height
    maxBlock?: number,
    // Number of records to skip before beginning search, this number is added onto min/max block
    offset?: number;
    // Number of records to return (page)
    size?: number;
    // Start search from block 1 instead of current block height
    reverse?: boolean;
};

const DEFAULT_BODY: RequestBody = {
    address: '',
    includeSend: true,
    includeReceive: true,
    includeChange: true,
    filterAddresses: [],
    excludedAddresses: [],
    minBlock: 0,
    maxBlock: 0,
    offset: 0,
    size: 25,
    reverse: false,
};

const setBodyDefaults = (body: RequestBody): void => {
    // Set defaults
    if (body.includeSend === undefined) {
        body.includeSend = DEFAULT_BODY.includeSend;
    }
    if (body.includeReceive === undefined) {
        body.includeReceive = DEFAULT_BODY.includeReceive;
    }
    if (body.includeChange === undefined) {
        body.includeChange = DEFAULT_BODY.includeChange;
    }
    if (body.excludedAddresses === undefined) {
        body.excludedAddresses = DEFAULT_BODY.excludedAddresses;
    }
    if (body.filterAddresses === undefined) {
        body.filterAddresses = DEFAULT_BODY.filterAddresses;
    }
    if (body.offset === undefined) {
        body.offset = DEFAULT_BODY.offset;
    }
    if (body.size === undefined) {
        body.size = DEFAULT_BODY.size;
    }
    if (body.reverse === undefined) {
        body.reverse = DEFAULT_BODY.reverse;
    }
    body.size = Math.min(body.size, 500);
};

const convertToConfirmedTransactionDto = (
    transaction: AccountHistoryResponse['history'][0]
): ConfirmedTransactionDto => {
    const type = getTransactionType(transaction);
    const rep = type === SUBTYPE.change ? transaction['representative'] : undefined;
    const unix = Number(transaction.local_timestamp);
    const amount = transaction.amount;

    const dto: ConfirmedTransactionDto = {
        hash: transaction.hash,
        address: transaction.account,
        type,
        height: Number(transaction.height),
        timestamp: unix,
        date: new Date(unix * 1000).toLocaleDateString() + ' ' + new Date(unix * 1000).toLocaleTimeString(),
        newRepresentative: rep,
    };

    if (amount) {
        dto.amountRaw = transaction.amount;
        dto.amount = convertFromRaw(transaction.amount, 10);
    }

    return dto;
};

const shouldIncludeTransaction = (tx: RpcConfirmedTransaction, body: RequestBody): boolean => {
    const type = getTransactionType(tx);
    const hasMaxAmountFilter = Boolean(body.maxAmount);
    const hasMinAmountFilter = Boolean(body.minAmount);
    const includedAddresses = new Set(body.filterAddresses);
    const excludedAddresses = new Set(body.excludedAddresses);

    if (!body.includeSend && type === 'send') {
        return;
    }
    if (!body.includeChange && type === 'change') {
        return;
    }
    if (!body.includeReceive && type === 'receive') {
        return;
    }

    // Amount Filters
    if ((hasMinAmountFilter || hasMaxAmountFilter) && type !== 'change') {
        if (hasMaxAmountFilter && convertFromRaw(tx.amount, 10) > body.maxAmount) {
            return;
        }
        if (hasMinAmountFilter && convertFromRaw(tx.amount, 10) < body.minAmount) {
            return;
        }
    }

    // Address Filters
    if (includedAddresses.size > 0) {
        if (type === 'change') {
            if (!includedAddresses.has(tx['representative'])) {
                return;
            }
        } else if (!includedAddresses.has(tx.account)) {
            return;
        }
    }
    if (excludedAddresses.size > 0) {
        if (type === 'change') {
            if (excludedAddresses.has(tx['representative'])) {
                return;
            }
        } else if (excludedAddresses.has(tx.account)) {
            return;
        }
    }
    return true;
};

/** Returns type for a transaction; defaults to subtype, but fallbacks to use type when subtype is undefined. */
const getTransactionType = (tx: AccountHistoryResponse['history'][0]): Subtype => tx['subtype'] || tx['type'];

/** For a given address, return a list of confirmed transactions.  Includes options for filtering.  */
const getConfirmedTransactionsPromise = async (body: RequestBody): Promise<ConfirmedTransactionDto[]> => {
    const address = body.address;

    if (!address) {
        return Promise.reject({ errorMsg: 'Address is required', errorCode: 1 });
    }
    if (!isValidAddress(address)) {
        return Promise.reject({ errorMsg: 'Invalid address', errorCode: 2 });
    }

    let blockCount = 0;
    try {
        const blockCountResponse = await accountBlockCountRpc(address);
        blockCount = Number(blockCountResponse.block_count);
    } catch (err) {
        if (err.error === 'Account not found') {
            // Handle RPC error.
            return Promise.reject({ errorMsg: 'Unopened Account', errorCode: 3 });
        }
        return Promise.reject(LOG_ERR('getConfirmedTransactionsPromise.getAccountBlockHeight', err));
    }

    const iterationSettings: IterateHistoryConfig = {
        address,
        blockCount,
        hasTerminatedSearch: false,
        transactionsPerRequest: 10_000,
        reverse: body.reverse,
        offset: body.offset,
        maxBlock: body.maxBlock,
        minBlock: body.minBlock
    };

    const confirmedTransactions = [];
    let exceededSearchSize = false;
    let blocksChecked = 0;

    await iterateHistory(iterationSettings, (tx: RpcConfirmedTransaction) => {
        blocksChecked++;
        if (confirmedTransactions.length === body.size) {
            iterationSettings.hasTerminatedSearch = true;
            return;
        }
        if (blocksChecked === 100_000) {
            iterationSettings.hasTerminatedSearch = true;
            exceededSearchSize = true;
            return;
        }
        if (shouldIncludeTransaction(tx, body)) {
            confirmedTransactions.push(convertToConfirmedTransactionDto(tx));
        }
    });

    if (exceededSearchSize) {
        return Promise.reject({
            errorMsg: 'Max blocks (100_000) checked.  Adjust your transaction filters to return less records.',
            errorCode: 4,
        });
    }

    return confirmedTransactions;
};

/** For a given address, return a list of confirmed transactions.  Includes options for filtering.  */
export const getConfirmedTransactionsV2 = (req, res): void => {
    setBodyDefaults(req.body);
    getConfirmedTransactionsPromise(req.body)
        .then((confirmedTx: ConfirmedTransactionDto[]) => {
            res.send(confirmedTx);
        })
        .catch((err) => {
            if (err.errorCode === 1) {
                return res.status(400).send(err);
            }
            if (err.errorCode === 2) {
                return res.status(400).send(err);
            }
            if (err.errorCode === 3) {
                return res.status(200).send([]);
            }
            res.status(500).send(err);
        });
};

/** For a given address, return a list of confirmed transactions.  Includes options for filtering.  */
export const getConfirmedTransactionsWSV2 = (msg: string, ws: WebSocket): Promise<void> => {
    if (!msg) {
        return;
    }

    try {
        const body = JSON.parse(msg);
        setBodyDefaults(body);
        getConfirmedTransactionsPromise(body) // body, ws
            .catch((err) => {
                ws.send(JSON.stringify(err));
                ws.close();
            });
    } catch (err) {
        LOG_ERR('getConfirmedTransactionsWSV2', err);
    }
};
