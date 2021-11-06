import { AccountsPendingResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '@app/config';

export const accountsPendingRpc = async (addresses: string[]): Promise<AccountsPendingResponse> =>
    NANO_CLIENT.accounts_pending(addresses, -1, {
        source: false,
        include_only_confirmed: true,
        sorting: true,
    })
        .then((pending: AccountsPendingResponse) => Promise.resolve(pending))
        .catch((err) => Promise.reject(err));
