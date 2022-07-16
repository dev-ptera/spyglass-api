import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '@app/config';

// TODO: Pass in a config object, this is too many params
export const accountHistoryRpc = async (
    address: string,
    offset: number,
    size: number,
    raw = true,
    reverse = false,
    head?: string
): Promise<AccountHistoryResponse> => {
    const body = {} as any;
    body.address = address;
    body.offset = offset;
    body.size = size;
    body.reverse = reverse;
    if (head) {
        body.head = head;
    }
    body.raw = raw;

    return NANO_CLIENT.account_history(address, size, body)
        .then((accountHistory: AccountHistoryResponse) => Promise.resolve(accountHistory))
        .catch((err) => Promise.reject(err));
};
