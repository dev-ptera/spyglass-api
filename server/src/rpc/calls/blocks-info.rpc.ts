import { BlocksInfoResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '@app/config';

export const blocksInfoRpc = async (blocks: string[]): Promise<BlocksInfoResponse> =>
    NANO_CLIENT.blocks_info(blocks, {
        json_block: true,
        source: true,
    })
        .then((blocksInfo: BlocksInfoResponse) => Promise.resolve(blocksInfo))
        .catch((err) => Promise.reject(err));
