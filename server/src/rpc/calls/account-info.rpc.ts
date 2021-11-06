import { AccountInfoResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '@app/config';

export const accountInfoRpc = async (address): Promise<AccountInfoResponse> =>
    NANO_CLIENT.account_info(address, {
        representative: true,
        pending: true,
        weight: true,
    })
        .then((accountInfo: AccountInfoResponse) => Promise.resolve(accountInfo))
        .catch((err) => Promise.reject(err));
