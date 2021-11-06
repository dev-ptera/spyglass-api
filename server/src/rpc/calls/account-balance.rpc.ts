import { AccountBalanceResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '@app/config';

export const accountBalanceRpc = async (address): Promise<AccountBalanceResponse> =>
    NANO_CLIENT.account_balance(address)
        .then((accountBalance: AccountBalanceResponse) => Promise.resolve(accountBalance))
        .catch((err) => Promise.reject(err));
