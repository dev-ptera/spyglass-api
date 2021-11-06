import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '@app/config';

export const accountHistoryRpc = async (
    address: string,
    offset: number,
    size: number,
    reverse = false
): Promise<AccountHistoryResponse> =>
    NANO_CLIENT.account_history(address, size, {
        offset,
        raw: true,
        reverse,
    })
        .then((accountHistory: AccountHistoryResponse) => Promise.resolve(accountHistory))
        .catch((err) => Promise.reject(err));
