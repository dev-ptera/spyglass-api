import { blocksInfoRpc } from '@app/rpc';
import { convertFromRaw, getAccurateHashTimestamp, LOG_ERR } from '@app/services';
import { BlockDto } from '@app/types';
import { BlocksInfoResponse, BlocksInfoResponseContents } from '@dev-ptera/nano-node-rpc';

type RequestBody = {
    blocks: string[],
}

const DEFAULT_BODY: RequestBody = {
    blocks: [],
}

const setBodyDefaults = (body: RequestBody): void => {
    if (body.blocks === undefined) {
        body.blocks = DEFAULT_BODY.blocks;
    }
}

export const blocksInfoPromise = (blocks: string[]): Promise<BlocksInfoResponse> =>
blocksInfoRpc(blocks)
    .then((blocks: BlocksInfoResponse) => {
        return Promise.resolve(blocks);
    })
    .catch((err) => {
        return Promise.reject(LOG_ERR('blocksInfoPromise', err, { blocks }));
    });

/** Returns block infos for given hashes (csv)*/
export const getBlocksInfoV1 = (req, res): void => {
    setBodyDefaults(req.body);
    const hashes = req.body.blocks;
    if (hashes.length > 500) {
        res.status(500).send('Too many blocks requested. Max 500.');
    }
    blocksInfoPromise(hashes)
        .then((blockInfo: BlocksInfoResponse) => {
            let blocks_info = [];
            for (let i=0; i < hashes.length; i++) {
                const block = blockInfo.blocks[hashes[i]];
                const contents = block.contents as BlocksInfoResponseContents;
                blocks_info.push({
                    amount: convertFromRaw(block.amount, 10),
                    amountRaw: block.amount,
                    balance: block.balance,
                    blockAccount: block.block_account,
                    confirmed: block.confirmed,
                    contents: {
                        account: contents.account,
                        balance: contents.balance,
                        link: contents.link,
                        linkAsAccount: contents.link_as_account,
                        previous: contents.previous,
                        representative: contents.representative,
                        type: contents.type,
                        signature: contents.signature,
                        work: contents.work,
                    },
                    height: Number(block.height),
                    timestamp: getAccurateHashTimestamp(hashes[i], block.local_timestamp),
                    sourceAccount: block.source_account,
                    subtype: block.subtype,
                } as BlockDto);
            }
            res.send(blocks_info);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
}