import {AccountBlockCountResponse} from '@dev-ptera/nano-node-rpc';
import {NANO_CLIENT} from '@app/config';

export const accountBlockCountRpc = async (account: string): Promise<AccountBlockCountResponse> =>
    NANO_CLIENT.account_block_count(account)
        .then((count: AccountBlockCountResponse) => Promise.resolve(count))
        .catch((err) => Promise.reject(err));
