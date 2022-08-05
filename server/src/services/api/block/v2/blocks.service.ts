import { blocksInfoRpc } from '@app/rpc';
import { LOG_ERR } from '@app/services';
import { BlocksInfoResponse } from '@dev-ptera/nano-node-rpc';

type RequestBody = {
    hashes: string[];
};

const DEFAULT_BODY: RequestBody = {
    hashes: [],
};

const setBodyDefaults = (body: RequestBody): void => {
    if (body.hashes === undefined) {
        body.hashes = DEFAULT_BODY.hashes;
    }
};

/** Returns raw RPC response. */
export const blocksInfoPromiseV2 = (hashes: string[]): Promise<BlocksInfoResponse> =>
    blocksInfoRpc(hashes)
        .then((blocks: BlocksInfoResponse) => {
            return Promise.resolve(blocks);
        })
        .catch((err) => {
            return Promise.reject(LOG_ERR('blocksInfoPromiseV2', err, { hashes }));
        });

/** Returns block infos for given hashes (csv)*/
export const getBlocksInfoV2 = async (req, res): Promise<void> => {
    setBodyDefaults(req.body);
    const hashes = req.body.hashes;
    const maxNumberHashes = 500;
    if (hashes.length > maxNumberHashes) {
        res.status(500).send({ error: `Too many blocks requested. Max is ${maxNumberHashes}` });
    }

    try {
        const dtos = await blocksInfoPromiseV2(hashes);
        res.send(dtos);
    } catch (err) {
        res.status(500).send(err);
    }
};
