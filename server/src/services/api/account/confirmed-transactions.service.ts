import { accountHistoryRpc } from '@app/rpc';
import { getAccurateHashTimestamp, LOG_ERR } from '@app/services';
import { ConfirmedTransactionDto, SUBTYPE } from '@app/types';
import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';

const MAX_PAGE_SIZE = 50;

export const confirmedTransactionsPromise = (
    address: string,
    offset: number,
    size: number
): Promise<ConfirmedTransactionDto[]> =>
    accountHistoryRpc(address, offset, size)
        .then((accountHistory: AccountHistoryResponse) => {
            const dtoTransactions: ConfirmedTransactionDto[] = [];
            for (const transaction of accountHistory.history) {
                // TODO: Update typing for 'raw = true' option
                const newRepresentative =
                    transaction['subtype'] === SUBTYPE.change ? transaction['representative'] : undefined;

                const unix = getAccurateHashTimestamp(transaction.hash, transaction.local_timestamp);
                dtoTransactions.push({
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
            return Promise.resolve(dtoTransactions);
        })
        .catch((err) => {
            return Promise.reject(LOG_ERR('getConfirmedTransactions', err, { address }));
        });

/** For a given address, return a list of confirmed transactions. */
export const getConfirmedTransactions = (req, res): void => {
    const address = req.query.address;
    const size = Math.min(req.query.size || MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = req.query.offset;

    confirmedTransactionsPromise(address, offset, size)
        .then((confirmedTx: ConfirmedTransactionDto[]) => {
            res.send(JSON.stringify(confirmedTx));
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
