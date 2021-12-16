import { blocksInfoRpc } from '@app/rpc';
import { convertFromRaw, getAccurateHashTimestamp, LOG_ERR } from '@app/services';
import { BlockDto } from '@app/types';
import { BlocksInfoResponse, BlocksInfoResponseContents } from '@dev-ptera/nano-node-rpc';

export const blocksInfoPromise = (blocks: string[]): Promise<BlocksInfoResponse> =>
    blocksInfoRpc(blocks)
        .then((blocks: BlocksInfoResponse) => {
            return Promise.resolve(blocks);
        })
        .catch((err) => {
            return Promise.reject(LOG_ERR('blocksInfoPromise', err, { blocks }));
        });

/** Returns block information for a given hash.  */
export const getBlockInfo = (req, res): void => {
    const parts = req.url.split('/');
    const hash = parts[parts.length - 1];

    blocksInfoPromise([hash])
        .then((blockInfo: BlocksInfoResponse) => {
            const block = blockInfo.blocks[hash];
            const contents = block.contents as BlocksInfoResponseContents;
            res.send({
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
                timestamp: getAccurateHashTimestamp(hash, block.local_timestamp),
                sourceAccount: block.source_account,
                subtype: block.subtype,
            } as BlockDto);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
