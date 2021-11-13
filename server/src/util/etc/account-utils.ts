import { AccountInfoResponse } from '@dev-ptera/nano-node-rpc';

export const getUnopenedAccount = (): AccountInfoResponse => {
    return {
        frontier: '',
        open_block: '',
        representative_block: '',
        balance: '',
        modified_timestamp: '0',
        block_count: '0',
        confirmation_height: '0',
        confirmation_height_frontier: '',
        account_version: undefined,
        representative: '',
        weight: '',
        pending: '',
    };
};
