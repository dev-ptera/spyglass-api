import { accountBalanceRpc, accountInfoRpc, delegatorsRpc } from '@app/rpc';
import { getUnopenedAccount, pendingTransactionsPromise, confirmedTransactionsPromise, LOG_ERR } from '@app/services';
import {
    AccountBalanceResponse,
    AccountInfoResponse,
    DelegatorsResponse,
    ErrorResponse,
} from '@dev-ptera/nano-node-rpc';
import { AccountOverviewDto, DelegatorDto } from '@app/types';
import { rawToBan } from 'banano-unit-converter';
import { AppCache } from '@app/config';

type DelegatorsOverview = {
    delegators: DelegatorDto[];
    count: number;
    weightSum: number;
};

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

const delegatorsPromise = (address: string): Promise<DelegatorsOverview> =>
    delegatorsRpc(address)
        .then((delegatorsResponse: DelegatorsResponse) => {
            const delegatorsDto: DelegatorDto[] = [];
            for (const key in delegatorsResponse.delegators) {
                /* Filters out 0-weight delegators.  These accounts delegate weight then transfer their funds.  */
                if (delegatorsResponse.delegators[key] !== '0') {
                    /* Filters out dust. */
                    const ban = Number(rawToBan(delegatorsResponse.delegators[key]));
                    if (isNaN(ban) || Number(ban.toFixed(10)) === 0) {
                        continue;
                    }
                    delegatorsDto.push({
                        address: key,
                        weightBan: ban,
                    });
                }
            }
            const count = delegatorsDto.length;

            // Sort by weight descending
            delegatorsDto.sort((a, b) => (a.weightBan < b.weightBan ? 1 : -1));

            let weightSum = 0;
            // Get total delegated weight
            delegatorsDto.map((a) => (weightSum += a.weightBan));

            /* Only return first 1000 delegators */
            return Promise.resolve({
                delegators: delegatorsDto.slice(0, 1000),
                count,
                weightSum,
            });
        })
        .catch((err) => {
            return Promise.reject(LOG_ERR('getDelegators', err, { address }));
        });

/** Given an address, returns an overview of the account including balance, confirmed/pending transactions, delegators, etc. */
export const getAccountOverview = (req, res): void => {
    const parts = req.url.split('/');
    const size = Math.min(req.query.size || 50, 50);
    const address = parts[parts.length - 1];

    Promise.all([
        accountBalancePromise(address),
        accountInfoPromise(address),
        delegatorsPromise(address),
        confirmedTransactionsPromise(address, 0, size),
        pendingTransactionsPromise(address, 0, size),
    ])
        .then(([accountBalance, accountInfo, delegatorsData, confirmedTransactions, pendingTransactions]) => {
            const accountOverview: AccountOverviewDto = {
                address,
                opened: Boolean(accountInfo.open_block),
                balanceRaw: accountBalance.balance,
                pendingRaw: accountBalance.pending,
                representative: accountInfo.representative,
                principal: delegatorsData.weightSum >= AppCache.networkStats.principalRepMinBan,
                completedTxCount: Number(accountInfo.block_count),
                pendingTxCount: Number(pendingTransactions.length),
                delegatorsCount: delegatorsData.count,
                delegatorsWeightSum: delegatorsData.weightSum,
                confirmedTransactions,
                pendingTransactions: pendingTransactions.splice(0, 50),
                delegators: delegatorsData.delegators,
            };
            res.send({ ...accountOverview });
        })
        .catch((err) => {
            res.status(500).send(LOG_ERR('getAccountOverview', err));
        });
};
