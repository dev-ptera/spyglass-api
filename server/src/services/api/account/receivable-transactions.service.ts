import { accountsPendingRpc } from '@app/rpc';
import { blockInfoPromiseV1, isValidAddress, LOG_ERR } from '@app/services';
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
    try {
        const dtos: ReceivableTransactionDto[] = [];
        const blocks = await blockInfoPromiseV1(hashes);
        blocks.map((block) => {
            dtos.push({
                address: block.blockAccount,
                amount: block.amount,
                amountRaw: block.amountRaw,
                hash: block.hash,
                timestamp: block.timestamp,
            });
        });
        return dtos;
    } catch (err) {
        Promise.reject(LOG_ERR('pendingTransactionsPromise.blocksInfoPromise', err, { address, size }));
    }
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
