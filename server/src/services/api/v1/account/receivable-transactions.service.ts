import { accountsPendingRpc } from '@app/rpc';
import { LOG_ERR, blockInfoPromise, getAccurateHashTimestamp, convertFromRaw, isValidAddress } from '@app/services';
import { BlocksInfoResponse } from '@dev-ptera/nano-node-rpc';
import { ReceivableTransactionDto } from '@app/types';

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

/** Looks ups pending transactions for a given account. */
export const receivableTransactionsPromise = async (body: RequestBody): Promise<ReceivableTransactionDto[]> => {
    setBodyDefaults(body);
    const address = body.address;
    const offset = body.offset;
    const size = body.size;

    if (!isValidAddress(address)) {
        return Promise.reject({ error: 'Address is required' });
    }

    /* Get a list of pending hashes for an account. */
    const pendingResponse = await accountsPendingRpc([address]).catch((err) =>
        Promise.reject(LOG_ERR('pendingTransactionsPromise.accountsPendingRpc', err, { address, size }))
    );

    /* Add hashes to a list, accounting for offset & size restrictions. */
    const hashes: string[] = [];
    const pendingTxs = pendingResponse.blocks[address];
    let i = 0;
    for (const hash in pendingTxs) {
        if (i++ >= offset) {
            hashes.push(hash);
        }
        if (hashes.length === size) {
            break;
        }
    }

    /* For each hash, look up details. */
    const dtos: ReceivableTransactionDto[] = [];
    await blockInfoPromise(hashes)
        .then((blocksResponse: BlocksInfoResponse) => {
            for (const hash in blocksResponse.blocks) {
                const block = blocksResponse.blocks[hash];
                dtos.push({
                    address: block.block_account,
                    amount: convertFromRaw(block.amount, 10),
                    amountRaw: block.amount,
                    hash,
                    timestamp: getAccurateHashTimestamp(hash, block.local_timestamp),
                });
            }
        })
        .catch((err) =>
            Promise.reject(LOG_ERR('pendingTransactionsPromise.blocksInfoPromise', err, { address, size }))
        );

    return dtos;
};

/** Looks ups pending transactions for a given account. */
export const getReceivableTransactionsV1 = (req, res): void => {
    receivableTransactionsPromise(req.body)
        .then((confirmedTx: ReceivableTransactionDto[]) => {
            res.send(confirmedTx);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
