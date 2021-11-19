import { accountHistoryRpc } from '@app/rpc';
import { LOG_ERR } from '@app/services';
import { ConfirmedTransactionDto } from '@app/types';
import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';

const MAX_PAGE_SIZE = 50;

const SUBTYPE = {
    change: 'change',
    receive: 'received',
    send: 'send',
};

export const confirmedTransactionsPromise = (
    address: string,
    offset: number,
    size: number
): Promise<ConfirmedTransactionDto[]> =>
    accountHistoryRpc(address, offset, size)
        .then((accountHistory: AccountHistoryResponse) => {
            const dtoTransactions: ConfirmedTransactionDto[] = [];
            for (const transaction of accountHistory.history) {
                const newRepresentative =
                    transaction['subtype'] === SUBTYPE.change ? transaction['representative'] : undefined;

                dtoTransactions.push({
                    hash: transaction.hash,
                    address: transaction.account,
                    type: transaction['subtype'],
                    balanceRaw: transaction.amount,
                    height: Number(transaction.height),
                    timestamp: Number(transaction.local_timestamp),
                    newRepresentative,
                });
            }
            return Promise.resolve(dtoTransactions);
        })
        .catch((err) => {
            return Promise.reject(LOG_ERR('getConfirmedTransactions', err, { address }));
        });

/** For a given address, return a list of confirmed transactions. */
export const getConfirmedTransactions = (req, res): void => {

    const parts = req.url.split('/');
    const address = parts[parts.length - 3];
    const offset = req.query.offset;

    confirmedTransactionsPromise(address, 0, 50)
        .then((confirmedTx: ConfirmedTransactionDto[]) => {
            res.send(JSON.stringify(confirmedTx));
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
