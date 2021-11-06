import { DelegatorsCountResponse } from '@dev-ptera/nano-node-rpc';
import { NANO_CLIENT } from '@app/config';

export const delegatorsCountRpc = async (address): Promise<DelegatorsCountResponse> =>
    NANO_CLIENT.delegators_count(address)
        .then((delegatorsCountResponse: DelegatorsCountResponse) => Promise.resolve(delegatorsCountResponse))
        .catch((err) => Promise.reject(err));
