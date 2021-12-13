import { accountInfoRpc } from '@app/rpc';
import {
    convertFromRaw,
    getDelegatorsCountPromise,
    getPRWeightPromise,
    LOG_ERR,
    receivableTransactionsPromise,
} from '@app/services';
import { AccountInfoResponse, ErrorResponse } from '@dev-ptera/nano-node-rpc';
import { AccountOverviewDto } from '@app/types';

export const getUnopenedAccount = (): AccountInfoResponse => {
    return {
        frontier: '',
        open_block: '',
        representative_block: '',
        balance: '0',
        modified_timestamp: '0',
        block_count: '0',
        confirmation_height: '0',
        confirmation_height_frontier: '',
        account_version: undefined,
        representative: '',
        weight: '0',
        pending: '0',
    };
};

const accountInfoPromise = (address: string): Promise<AccountInfoResponse> =>
    accountInfoRpc(address)
        .then((accountInfo: AccountInfoResponse) => {
            return Promise.resolve(accountInfo);
        })
        .catch((err: ErrorResponse) => {
            if (err.error && err.error === 'Account not found') {
                return Promise.resolve(getUnopenedAccount());
            } else {
                return Promise.reject(LOG_ERR('getAccountOverview.getAccountInfo', err, { address }));
            }
        });

/** Given an address, returns an overview of the account including balance, confirmed/pending transactions, delegators, etc. */
export const getAccountOverview = (req, res): void => {
    const parts = req.url.split('/');
    const address = parts[parts.length - 1];

    Promise.all([
        accountInfoPromise(address),
        getPRWeightPromise(),
        receivableTransactionsPromise({ address, offset: 0, size: 10000 }),
        getDelegatorsCountPromise(address),
    ])
        .then(([accountData, prWeight, receivable, delegatorsCount]) => {
            const weight = convertFromRaw(accountData.weight);
            const accountOverview: AccountOverviewDto = {
                address,
                blockCount: Number(accountData.block_count),
                balance: convertFromRaw(accountData.balance),
                balanceRaw: accountData.balance,
                delegatorsCount: delegatorsCount,
                opened: Boolean(accountData.open_block),
                receivable: convertFromRaw(accountData.pending),
                receivableRaw: accountData.pending,
                representative: accountData.representative,
                principal: weight > prWeight,
                weight,
            };
            res.send(accountOverview);
        })
        .catch((err) => {
            res.status(500).send(LOG_ERR('getAccountOverview', err));
        });
};
