import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '@app/config';

export const accountHistoryRpc = async (
    address: string,
    offset: number,
    size: number,
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

    return NANO_CLIENT.account_history(address, size, body)
        .then((accountHistory: AccountHistoryResponse) => Promise.resolve(accountHistory))
        .catch((err) => Promise.reject(err));
};
