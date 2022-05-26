import { accountBlockCountRpc, accountHistoryRpc } from '@app/rpc';
import { convertFromRaw, getAccurateHashTimestamp, isValidAddress, LOG_ERR } from '@app/services';
import { ConfirmedTransactionDto } from '@app/types';
import { AccountHistoryResponse, Subtype } from '@dev-ptera/nano-node-rpc/dist/types/rpc-response';

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

/** Uses RPC commands to sift through an accounts list of confirmed transactions.
 *  Returns true when either there are no more search results, or the number of requests records is met.
 * */
const discoverConfirmedTransactions = async (
    body: RequestBody,
    searches: number,
    confirmedTx: ConfirmedTransactionDto[]
): Promise<boolean> => {
    const rpcSearchSize = 2000;
    const address = body.address;
    const offset = Number(body.offset) + rpcSearchSize * searches;
    const hasMaxAmountFilter = Boolean(body.maxAmount);
    const hasMinAmountFilter = Boolean(body.minAmount);
    const addressFilterSet = new Set(body.filterAddresses);

    const accountTx = await accountHistoryRpc(address, offset, rpcSearchSize);

    // If we run out of search results, it's time to exit.
    if (!accountTx.history || accountTx.history.length === 0) {
        return true;
    }

    // Iterate through each transaction history, filtering out types we don't need.
    for (const transaction of accountTx.history) {
        const type = getTransactionType(transaction);
        if (!body.includeSend && type === 'send') {
            continue;
        }
        if (!body.includeChange && type === 'change') {
            continue;
        }
        if (!body.includeReceive && type === 'receive') {
            continue;
        }

        // Amount Filters
        if ((hasMinAmountFilter || hasMaxAmountFilter) && type !== 'change') {
            if (hasMaxAmountFilter && convertFromRaw(transaction.amount, 10) > body.maxAmount) {
                continue;
            }
            if (hasMinAmountFilter && convertFromRaw(transaction.amount, 10) < body.minAmount) {
                continue;
            }
        }

        // Address Filters
        if (addressFilterSet.size > 0) {
            if (type === 'change') {
                if (!addressFilterSet.has(transaction['representative'])) {
                    continue;
                }
            } else if (!addressFilterSet.has(transaction.account)) {
                continue;
            }
        }
        confirmedTx.push(convertToConfirmedTransactionDto(transaction));
        if (confirmedTx.length === body.size) {
            return true;
        }
    }

    // Continue search.
    return false;
};

/** Returns type for a transaction; defaults to subtype, but fallbacks to use type when subtype is undefined. */
const getTransactionType = (tx: AccountHistoryResponse['history'][0]): Subtype => tx['subtype'] || tx['type'];

/** For a given address, return a list of confirmed transactions. */
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
            // RPC error.
            return Promise.reject({ errorMsg: 'Unopened Account', errorCode: 3 });
        }
        return Promise.reject(LOG_ERR('accountHistoryPromise.getAccountBlockHeight', err));
    }

    let searchPage = 0;
    let completedSearch = false;
    const confirmedTransactions: ConfirmedTransactionDto[] = [];

    try {
        while (!completedSearch) {
            completedSearch = await discoverConfirmedTransactions(body, searchPage++, confirmedTransactions);
        }
        return confirmedTransactions;
    } catch (err) {
        return Promise.reject(LOG_ERR('accountHistoryPromise.discoverConfirmedTransactions', err));
    }
};

/** For a given address, return a list of confirmed transactions. */
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
