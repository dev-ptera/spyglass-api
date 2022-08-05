import { blocksInfoPromiseV2, isValidAddress, LOG_ERR } from '@app/services';
import { BlockAtHeightDto } from '@app/types';
import { accountHistoryRpc } from '@app/rpc';

const getAccountBlockPromise = async (address: string, height: number): Promise<BlockAtHeightDto> => {
    try {
        const accountHistory = await accountHistoryRpc(address, height - 1, 1, true, true);
        const hash = accountHistory.history[0].hash;
        const blocks = await blocksInfoPromiseV2([hash]);
        const block = blocks.blocks[hash] as any;
        block.hash = hash;
        return block;
    } catch (err) {
        return Promise.reject(LOG_ERR('getAccountBlockPromiseV2', err, { address, height }));
    }
};

/** Given an account & a height, returns block information. */
export const getAccountBlockV2 = async (req, res): Promise<void> => {
    const height = Number(req.body.height);
    const address = req.body.address;
    if (!isValidAddress(address)) {
        return res.status(400).send({ errorMsg: 'Address is required', errorCode: 1 });
    }
    if (!height || isNaN(height)) {
        return res.status(400).send({ errorMsg: 'Height is required', errorCode: 2 });
    }

    try {
        const block = await getAccountBlockPromise(address, height);
        res.send(block);
    } catch (err) {
        res.status(500).send({ errorMsg: 'Internal Server Error', errorCode: 3 });
    }
};
