import { accountsPendingRpc } from '@app/rpc';
import { LOG_ERR, blocksInfoPromise } from '@app/services';
import { PendingTransactionDto } from '@app/types';
import { AppCache } from '@app/config';
import { AccountsPendingResponse, BlocksInfoResponse } from '@dev-ptera/nano-node-rpc';

export const pendingTransactionsPromise = async (address: string, offset: number, size: number) =>
    accountsPendingRpc([address])
        .then(async (accountsPendingResponse: AccountsPendingResponse) => {
            const hashes: string[] = [];
            const pendingTxs = accountsPendingResponse.blocks[address];
            let i = 0;
            for (const hash in pendingTxs) {
                if (i >= offset) {
                    hashes.push(hash);
                }
                if (i++ > offset + Math.min(50, size)) {
                    break;
                }
            }
            const dto: PendingTransactionDto[] = [];
            await blocksInfoPromise(hashes)
                .then((blocksResponse: BlocksInfoResponse) => {
                    for (const hash in blocksResponse.blocks) {
                        const block = blocksResponse.blocks[hash];
                        dto.push({
                            address: block.block_account,
                            timestamp: Number(AppCache.historicHash.get(hash) || block.local_timestamp),
                            balanceRaw: block.amount,
                            hash,
                        });
                    }
                })
                .catch((err) => {
                    return Promise.reject(err);
                });

            return Promise.resolve(dto);
        })
        .catch((err) => {
            return Promise.reject(LOG_ERR('getAccountsPending', err, { address, source: false }));
        });

/** Looks ups pending transactions for a given account. */
export const getPendingTransactions = (req, res): void => {
    const address = req.query.address;
    const offset = req.query.offset || 0;
    const size = Math.min(req.query.size || 50, 50);
    pendingTransactionsPromise(address, offset, size)
        .then((confirmedTx: PendingTransactionDto[]) => {
            res.send(JSON.stringify(confirmedTx));
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
