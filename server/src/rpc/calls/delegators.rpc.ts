import { DelegatorsResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '@app/config';

export const delegatorsRpc = async (account, threshold: string): Promise<DelegatorsResponse> =>
    // @ts-ignore
    NANO_CLIENT._send('delegators', {
        account,
        threshold,
        count: 100000,
    })
        .then((delegators: DelegatorsResponse) => Promise.resolve(delegators))
        .catch((err) => Promise.reject(err));
