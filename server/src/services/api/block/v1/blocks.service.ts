import { blocksInfoRpc } from '@app/rpc';
import { blockInfoPromiseV1, LOG_ERR } from '@app/services';
import { BlocksInfoResponse } from '@dev-ptera/nano-node-rpc';

type RequestBody = {
    blocks: string[];
};

const DEFAULT_BODY: RequestBody = {
    blocks: [],
};

const setBodyDefaults = (body: RequestBody): void => {
    if (body.blocks === undefined) {
        body.blocks = DEFAULT_BODY.blocks;
    }
};

export const blocksInfoPromise = (blocks: string[]): Promise<BlocksInfoResponse> =>
    blocksInfoRpc(blocks)
        .then((blocks: BlocksInfoResponse) => {
            return Promise.resolve(blocks);
        })
        .catch((err) => {
            return Promise.reject(LOG_ERR('blocksInfoPromise', err, { blocks }));
        });

/** Returns block infos for given hashes (csv)*/
export const getBlocksInfoV1 = async (req, res): Promise<void> => {
    setBodyDefaults(req.body);
    const hashes = req.body.blocks; // TODO this should be 'hashes'.
    const maxNumberBlocks = 500; // TODO 'maxNumberHashes'
    if (hashes.length > maxNumberBlocks) {
        res.status(500).send({ error: `Too many blocks requested. Max is ${maxNumberBlocks}` });
    }

    try {
        const dtos = await blockInfoPromiseV1(hashes);
        res.send(dtos);
    } catch (err) {
        res.status(500).send(err);
    }
};
