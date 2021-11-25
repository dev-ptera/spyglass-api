import {accountBlockCountRpc, accountHistoryRpc} from '@app/rpc';
import {getAccurateHashTimestamp, LOG_ERR, sleep} from '@app/services';
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
    resultSize?: number;
};

const DEFAULT_BODY: RequestBody = {
    address: '',
    includeSend: true,
    includeReceive: true,
    includeChange: true,
    offset: 0,
    resultSize: 25,
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
    if (body.resultSize === undefined) {
        body.resultSize = DEFAULT_BODY.resultSize;
    }
    body.resultSize = Math.min(body.resultSize, 500);
};

export const accountHistoryPromise = async (body: RequestBody): Promise<ConfirmedTransactionDto[]> => {
    setBodyDefaults(body);

    const confirmedTransactions: ConfirmedTransactionDto[] = [];
    const rpcSearchSize = 500;
    let searchPage = 0;

    const accountBlockCount =
        await accountBlockCountRpc(body.address)
            .catch((err) => {
                return Promise.reject(LOG_ERR('accountHistoryPromise.getAccountBlockHeight', err))
            });
    console.log(accountBlockCount.block_count);


    let completedSearch = false;
    while (!completedSearch) {
        const offset = Number(body.offset) + (rpcSearchSize * searchPage);
        const accountTx = await accountHistoryRpc(body.address, offset, rpcSearchSize).catch((err) => {
            return Promise.reject(LOG_ERR('accountHistoryPromise.accountHistoryRpc', err, { body }));
        });

        searchPage++;
        // If we have ran out of search results, it's time to exit.
        if (!accountTx.history || accountTx.history.length === 0) {
            break;
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
            confirmedTransactions.push({
                hash: transaction.hash,
                address: transaction.account,
                type: transaction['subtype'],
                balanceRaw: transaction.amount,
                height: Number(transaction.height),
                timestamp: unix,
                date: new Date(unix * 1000).toLocaleDateString() + ' ' + new Date(unix * 1000).toLocaleTimeString(),
                newRepresentative: rep,
            });
            if (confirmedTransactions.length === body.resultSize) {
                completedSearch = true;
                break;
            }
        }
    }
    return confirmedTransactions;
};

/** For a given address, return a list of confirmed transactions. */
export const getAccountHistory = (req, res): void => {
    accountHistoryPromise(req.body)
        .then((confirmedTx: ConfirmedTransactionDto[]) => {
            res.send(confirmedTx);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
