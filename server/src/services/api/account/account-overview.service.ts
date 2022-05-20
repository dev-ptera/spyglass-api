import { accountBalanceRpc, accountInfoRpc } from '@app/rpc';
import { convertFromRaw, getDelegatorsCountPromise, getPRWeightPromise, isValidAddress, LOG_ERR } from '@app/services';
import { AccountBalanceResponse, AccountInfoResponse, ErrorResponse } from '@dev-ptera/nano-node-rpc';
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

/** Given an address, returns account balance using RPC commands. */
const accountBalancePromise = (address: string): Promise<AccountBalanceResponse> =>
    accountBalanceRpc(address)
        .then((accountInfo: AccountBalanceResponse) => {
            return Promise.resolve(accountInfo);
        })
        .catch((err) => {
            return Promise.reject(LOG_ERR('getAccountOverview.getAccountBalance', err, { address }));
        });

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
export const getAccountOverviewV1 = (req, res): void => {
    const parts = req.url.split('/');
    const address = parts[parts.length - 1];

    if (!isValidAddress(address)) {
        return res.status(400).send({ error: 'Address is required' });
    }

    Promise.all([
        accountInfoPromise(address),
        getPRWeightPromise(),
        accountBalancePromise(address),
        getDelegatorsCountPromise(address),
    ])
        .then(([accountData, prWeight, balance, delegatorsCount]) => {
            const weight = convertFromRaw(accountData.weight);
            const accountOverview: AccountOverviewDto = {
                address,
                balance: undefined,
                balanceRaw: undefined,
                blockCount: Number(accountData.block_count),
                delegatorsCount: delegatorsCount,
                opened: Boolean(accountData.open_block),
                receivable: convertFromRaw(balance.pending, 10),
                receivableRaw: balance.pending,
                representative: undefined,
                principal: weight > prWeight,
                weight: undefined,
            };
            if (accountOverview.opened) {
                accountOverview.balance = convertFromRaw(balance.balance, 10);
                accountOverview.balanceRaw = balance.balance;
                accountOverview.representative = accountData.representative;
                accountOverview.weight = weight;
            }

            res.send(accountOverview);
        })
        .catch((err) => {
            res.status(500).send(LOG_ERR('getAccountOverview', err));
        });
};
