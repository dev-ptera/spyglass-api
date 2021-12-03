import { NANO_CLIENT } from '@app/config';
import { convertFromRaw, getBurnPromise, getDeveloperFundsPromise } from '@app/services';
import { SupplyDto } from '@app/types';

export const getSupplyPromise = async (): Promise<SupplyDto> => {
    /* Burn */
    const burnedTotal = await getBurnPromise().then((data) => data.totalAmount);

    /* Developers | Core Team Funds */
    const devFundTotal = await getDeveloperFundsPromise().then((data) => data.totalBalance);

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
