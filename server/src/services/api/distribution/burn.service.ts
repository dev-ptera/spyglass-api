import { BURN_ADDRESSES, NANO_CLIENT } from '@app/config';
import { convertFromRaw, LOG_ERR } from '@app/services';
import { BasicAccount, BurnAccountsDto } from '@app/types';

/** Returns burn-account statistics. */
export const getBurnPromise = async (): Promise<BurnAccountsDto> => {
    const burnAddressPromises = [];
    BURN_ADDRESSES.map((address) =>
        burnAddressPromises.push(
            NANO_CLIENT.account_balance(address).then((data) => ({
                address,
                pending: convertFromRaw(data.pending),
            }))
        )
    );

    const burnArr: BasicAccount[] = await Promise.all(burnAddressPromises).catch((err) =>
        Promise.reject(LOG_ERR('getBurnPromise', err))
    );

    let burnTotal = 0;
    burnArr.map((account) => (burnTotal += account.pending));

    return {
        totalAmount: burnTotal,
        burnAccounts: burnArr,
    };
};

/** Returns burn-account statistics. */
export const getBurnV1 = (res): void => {
    getBurnPromise()
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
