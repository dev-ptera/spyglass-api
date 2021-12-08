import { accountBlockCountRpc, accountHistoryRpc } from '@app/rpc';
import {convertFromRaw, getAccurateHashTimestamp, isValidAddress, LOG_ERR, sleep} from '@app/services';
import { ConfirmedTransactionDto } from '@app/types';

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
    offset?: number;
    size?: number;
};

const DEFAULT_BODY: RequestBody = {
    address: '',
    includeSend: true,
    includeReceive: true,
    includeChange: true,
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

/** Uses RPC commands to sift through an accounts list of confirmed transactions.
 *  Returns true when either there are no more search results, or the number of requests records is met.
 * */
const discoverConfirmedTransactions = async (
    body: RequestBody,
    searches: number,
    confirmedTx: ConfirmedTransactionDto[]
): Promise<boolean> => {
    const rpcSearchSize = 200;
    const address = body.address;
    const offset = Number(body.offset) + rpcSearchSize * searches;

    const accountTx = await accountHistoryRpc(address, offset, rpcSearchSize).catch((err) => {
        return Promise.reject(LOG_ERR('accountHistoryPromise.accountHistoryRpc', err, { body }));
    });

    // If we have ran out of search results, it's time to exit.
    if (!accountTx.history || accountTx.history.length === 0) {
        return true;
    }

    // Iterate through each transaction history, filtering out types we dont need.
    for (const transaction of accountTx.history) {
        const type = transaction['subtype'];
        if (!body.includeSend && type === 'send') {
            continue;
        }
        if (!body.includeChange && type === 'change') {
            continue;
        }
        if (!body.includeReceive && type === 'receive') {
            continue;
        }
        const rep = transaction['subtype'] === SUBTYPE.change ? transaction['representative'] : undefined;
        const unix = getAccurateHashTimestamp(transaction.hash, transaction.local_timestamp);
        confirmedTx.push({
            hash: transaction.hash,
            address: transaction.account,
            type: transaction['subtype'],
            amountRaw: transaction.amount,
            amount: convertFromRaw(transaction.amount, 10),
            height: Number(transaction.height),
            timestamp: unix,
            date: new Date(unix * 1000).toLocaleDateString() + ' ' + new Date(unix * 1000).toLocaleTimeString(),
            newRepresentative: rep,
        });
        if (confirmedTx.length === body.size) {
            return true;
        }
    }

    // Continue search.
    return false;
};

/** For a given address, return a list of confirmed transactions. */
export const getConfirmedTransactionsPromise = async (body: RequestBody): Promise<ConfirmedTransactionDto[]> => {
    setBodyDefaults(body);

    const confirmedTransactions: ConfirmedTransactionDto[] = [];
    const address = body.address;

    if (!isValidAddress(address)) {
        return Promise.reject({ error: 'Address is required' });
    }

    const accountBlockCount = await accountBlockCountRpc(address).catch((err) =>
        Promise.reject(LOG_ERR('accountHistoryPromise.getAccountBlockHeight', err))
    );

    console.log(accountBlockCount.block_count);

    let searchPage = 0;
    let completedSearch = false;
    while (!completedSearch) {
        completedSearch = await discoverConfirmedTransactions(body, searchPage++, confirmedTransactions).catch((err) =>
            Promise.reject(LOG_ERR('accountHistoryPromise.discoverConfirmedTransactions', err))
        );
    }
    return confirmedTransactions;
};

/** For a given address, return a list of confirmed transactions. */
export const getConfirmedTransactions = (req, res): void => {
    getConfirmedTransactionsPromise(req.body)
        .then((confirmedTx: ConfirmedTransactionDto[]) => {
            res.send(confirmedTx);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
