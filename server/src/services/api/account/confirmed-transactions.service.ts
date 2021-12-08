import { accountHistoryRpc } from '@app/rpc';
import { getAccurateHashTimestamp, LOG_ERR } from '@app/services';
import { ConfirmedTransactionDto, SUBTYPE } from '@app/types';

const MAX_PENDING_SIZE = 500;

type RequestBody = {
    address: string;
    size: number;
    offset: number;
};

const DEFAULT_BODY: RequestBody = {
    address: '',
    size: 50,
    offset: 0,
};

const setBodyDefaults = (body: RequestBody): void => {
    if (body.size === undefined) {
        body.size = DEFAULT_BODY.size;
    }
    if (body.offset === undefined) {
        body.offset = DEFAULT_BODY.offset;
    }
    body.size = Math.min(MAX_PENDING_SIZE, body.size);
};

/** For a given address, return a list of confirmed transactions. */
export const confirmedTransactionsPromise = async (body: RequestBody): Promise<ConfirmedTransactionDto[]> => {
    setBodyDefaults(body);
    const address = body.address;
    const offset = body.offset;
    const size = body.size;

    /* Get a list of confirmed tx for an account. */
    const accountHistory = await accountHistoryRpc(address, offset, size).catch((err) =>
        Promise.reject(LOG_ERR('confirmedTransactionsPromise.accountHistoryRpc', err))
    );

    const dtos: ConfirmedTransactionDto[] = [];
    for (const transaction of accountHistory.history) {
        // TODO: Update typing for 'raw = true' option
        const newRepresentative = transaction['subtype'] === SUBTYPE.change ? transaction['representative'] : undefined;

        const unix = getAccurateHashTimestamp(transaction.hash, transaction.local_timestamp);
        dtos.push({
            hash: transaction.hash,
            address: transaction.account,
            type: transaction['subtype'],
            balanceRaw: transaction.amount,
            height: Number(transaction.height),
            timestamp: unix,
            date: new Date(unix * 1000).toLocaleDateString() + ' ' + new Date(unix * 1000).toLocaleTimeString(),
            newRepresentative,
        });
    }
    return dtos;
};

/** For a given address, return a list of confirmed transactions. */
export const getConfirmedTransactions = (req, res): void => {
    confirmedTransactionsPromise(req.body)
        .then((confirmedTx: ConfirmedTransactionDto[]) => {
            res.send(JSON.stringify(confirmedTx));
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
