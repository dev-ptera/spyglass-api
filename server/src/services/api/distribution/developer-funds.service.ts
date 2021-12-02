import { DEVELOPER_FUNDS, NANO_CLIENT } from '@app/config';
import { convertFromRaw, LOG_ERR } from '@app/services';
import { DeveloperFundsDto } from '@app/types';

export const getDeveloperFundsPromise = async (): Promise<DeveloperFundsDto> => {
    const devFundAddressPromises = [];
    const devWallets: { address: string; balance: number }[] = [];

    /* For each address, fetch/return balance & add a new devWallet entry. */
    DEVELOPER_FUNDS.map((address) =>
        devFundAddressPromises.push(
            NANO_CLIENT.account_balance(address).then((data) => {
                const balance = convertFromRaw(data.balance);
                devWallets.push({ address, balance });
                return balance;
            })
        )
    );

    /* Perform RPC requests for all accounts. */
    const devFundArr: number[] = await Promise.all(devFundAddressPromises).catch((err) =>
        Promise.reject(LOG_ERR('devFundAddressPromises', err))
    );

    /* Aggregate developer fund balance. */
    const devFundTotal = devFundArr.reduce((a, b) => a + b);

    /* Sort devWallets by balance, descending. */
    devWallets.sort((a, b) => (a.balance > b.balance ? -1 : 1));

    return {
        totalBalance: devFundTotal,
        wallets: devWallets,
    };
};

/** Returns all accounts and balances of core-team owned funds.  (e.g. developer funds, foundation funds, etc). */
export const getDeveloperFunds = (res): void => {
    getDeveloperFundsPromise()
        .then((accounts) => {
            res.send(accounts);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
