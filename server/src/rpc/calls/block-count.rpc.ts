import {NANO_CLIENT} from '@app/config';
import {BlockCountResponse} from "@dev-ptera/nano-node-rpc";

export const blockCountRpc = async (): Promise<BlockCountResponse> =>
    NANO_CLIENT.block_count()
        .then((data: BlockCountResponse) => Promise.resolve(data))
        .catch((err) => Promise.reject(err));
