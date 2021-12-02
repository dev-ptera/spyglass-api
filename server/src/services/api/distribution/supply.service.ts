import { BURN_ADDRESSES, DEVELOPER_FUNDS, NANO_CLIENT } from '@app/config';
import { convertFromRaw } from '@app/services';
import { SupplyDto } from '@app/types';

export const getSupplyPromise = async (): Promise<SupplyDto> => {
    /* Burn */
    const burnAddressPromises = [];
    BURN_ADDRESSES.map((burn) =>
        burnAddressPromises.push(NANO_CLIENT.account_balance(burn).then((data) => convertFromRaw(data.pending)))
    );
    const burnArr: number[] = await Promise.all(burnAddressPromises);
    const burnedTotal = burnArr.reduce((a, b) => a + b);

    /* Developers | Core Team Funds */
    const devFundAddressPromises = [];
    DEVELOPER_FUNDS.map((dev) =>
        devFundAddressPromises.push(NANO_CLIENT.account_balance(dev).then((data) => convertFromRaw(data.balance)))
    );
    const devFundArr: number[] = await Promise.all(devFundAddressPromises);
    const devFundTotal = devFundArr.reduce((a, b) => a + b);

    /* Total Supply */
    const supply = await NANO_CLIENT.available_supply().then((data) => convertFromRaw(data.available));

    const circulating = supply - burnedTotal - devFundTotal;
    const nonBurned = supply - burnedTotal;
    return {
        burnedAmount: burnedTotal,
        circulatingAmount: circulating,
        circulatingPercent: circulating / nonBurned,
        devFundAmount: devFundTotal,
        devFundPercent: devFundTotal / nonBurned,
        totalAmount: supply,
    };
};

/** Returns circulating, burned, and core-team controlled supply statistics. */
export const getSupply = (res): void => {
    getSupplyPromise()
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
