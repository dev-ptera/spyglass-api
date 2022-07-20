import { blockInfoPromise, isValidAddress, LOG_ERR } from '@app/services';
import { BlockDto } from '@app/types';
import { accountHistoryRpc } from '@app/rpc';

const getAccountBlockPromise = async (address: string, height: number): Promise<BlockDto> => {
    try {
        const accountHistory = await accountHistoryRpc(address, height - 1, 1, true, true);
        const blocks = await blockInfoPromise([accountHistory.history[0].hash]);
        return blocks[0];
    } catch (err) {
        return Promise.reject(LOG_ERR('getAccountBlockPromise', err, { address, height }));
    }
};

/** Given an account & a height, returns block information. */
export const getAccountBlockV1 = async (req, res): Promise<void> => {
    const height = Number(req.body.height);
    const address = req.body.address;
    if (!isValidAddress(address)) {
        return res.status(400).send({ errorMsg: 'Address is required', errorCode: 1 });
    }
    if (!height || isNaN(height)) {
        return res.status(400).send({ errorMsg: 'Block is required', errorCode: 2 });
    }

    try {
        const block = await getAccountBlockPromise(address, height);
        res.send(block);
    } catch (err) {
        res.status(500).send({ errorMsg: 'Internal Server Error', errorCode: 3 });
    }
};
