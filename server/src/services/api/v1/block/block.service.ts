import { blocksInfoRpc } from '@app/rpc';
import { convertFromRaw, getAccurateHashTimestamp, LOG_ERR } from '@app/services';
import { BlockDto } from '@app/types';
import { BlocksInfoResponse, BlocksInfoResponseContents } from '@dev-ptera/nano-node-rpc';

/** DEPRECATED */
export const blockInfoPromise = (blocks: string[]): Promise<BlocksInfoResponse> =>
    blocksInfoRpc(blocks)
        .then((blocks: BlocksInfoResponse) => {
            return Promise.resolve(blocks);
        })
        .catch((err) => {
            return Promise.reject(LOG_ERR('blocksInfoPromise', err, { blocks }));
        });

/** Given a list of hashes, returns a BlockDto array. */
export const blockInfoPromiseV2 = (hashes: string[]): Promise<BlockDto[]> =>
    blocksInfoRpc(hashes)
        .then((blocksInfo: BlocksInfoResponse) => {
            const dtos: BlockDto[] = [];
            hashes.map((hash) => {
                const block = blocksInfo.blocks[hash];
                const contents = block.contents as BlocksInfoResponseContents;
                dtos.push({
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
                        type: contents.type as 'state',
                        signature: contents.signature,
                        work: contents.work,
                    },
                    height: Number(block.height),
                    timestamp: getAccurateHashTimestamp(hash, block.local_timestamp),
                    sourceAccount: block.source_account,
                    subtype: block.subtype,
                });
            });
            return Promise.resolve(dtos);
        })
        .catch((err) => {
            return Promise.reject(LOG_ERR('blocksInfoPromise', err, { hashes }));
        });

/** Returns block information for a given hash.  */
export const getBlockInfoV1 = async (req, res): Promise<void> => {
    const parts = req.url.split('/');
    const hash = parts[parts.length - 1];
    try {
        const dtos = await blockInfoPromiseV2([hash]);
        res.send(dtos);
    } catch (err) {
        res.status(500).send(err);
    }
};
