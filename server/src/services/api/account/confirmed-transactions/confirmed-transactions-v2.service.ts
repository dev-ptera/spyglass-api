import { accountBlockCountRpc } from '@app/rpc';
import { convertFromRaw, getAccurateHashTimestamp, isValidAddress, LOG_ERR } from '@app/services';
import { ConfirmedTransactionDto } from '@app/types';
import { AccountHistoryResponse, Subtype } from '@dev-ptera/nano-node-rpc/dist/types/rpc-response';
import { iterateHistory, IterateHistoryConfig, RpcConfirmedTransaction } from '../account-history.service';

const SUBTYPE = {
    change: 'change',
    receive: 'received',
    send: 'send',
};

type RequestBody = {
    address: string;
    includeSend?: boolean;
    includeReceive?: boolean;
    includeChange?: boolean;
    filterAddresses?: string[];
    minAmount?: number;
    maxAmount?: number;
    offset?: number;
    size?: number;
};

const DEFAULT_BODY: RequestBody = {
    address: '',
    includeSend: true,
    includeReceive: true,
    includeChange: true,
    filterAddresses: [],
    offset: 0,
    size: 25,
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
    if (body.offset === undefined) {
        body.offset = DEFAULT_BODY.offset;
    }
    if (body.size === undefined) {
        body.size = DEFAULT_BODY.size;
    }
    body.size = Math.min(body.size, 500);
};

const convertToConfirmedTransactionDto = (
    transaction: AccountHistoryResponse['history'][0]
): ConfirmedTransactionDto => {
    const type = getTransactionType(transaction);
    const rep = type === SUBTYPE.change ? transaction['representative'] : undefined;
    const unix = getAccurateHashTimestamp(transaction.hash, transaction.local_timestamp);
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
    const addressFilterSet = new Set(body.filterAddresses);
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
    if (addressFilterSet.size > 0) {
        if (type === 'change') {
            if (!addressFilterSet.has(tx['representative'])) {
                return;
            }
        } else if (!addressFilterSet.has(tx.account)) {
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

    try {
        await accountBlockCountRpc(address);
    } catch (err) {
        if (err.error === 'Account not found') {
            // Handle RPC error.
            return Promise.reject({ errorMsg: 'Unopened Account', errorCode: 3 });
        }
        return Promise.reject(LOG_ERR('getConfirmedTransactionsPromise.getAccountBlockHeight', err));
    }

    const iterationSettings: IterateHistoryConfig = {
        address,
        hasTerminatedSearch: false,
        transactionsPerRequest: 2_000,
        reverse: false,
        offset: body.offset,
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
