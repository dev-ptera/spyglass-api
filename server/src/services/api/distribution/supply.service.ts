import { NANO_CLIENT } from '@app/config';
import { convertFromRaw, getBurnPromise, getDeveloperFundsPromise, LOG_ERR } from '@app/services';
import { SupplyDto } from '@app/types';

export const getSupplyPromise = async (): Promise<SupplyDto> => {
    /* Burn */
    const burnedTotal = await getBurnPromise()
        .then((data) => data.totalAmount)
        .catch(Promise.reject);

    /* Developers | Core Team Funds */
    const devFundTotal = await getDeveloperFundsPromise()
        .then((data) => data.totalBalance)
        .catch(Promise.reject);

    /* Total Supply */
    const supply = await NANO_CLIENT.available_supply()
        .then((data) => convertFromRaw(data.available))
        .catch((err) => Promise.reject(LOG_ERR('available_supply', err)));

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
export const getSupplyV1 = (res): void => {
    getSupplyPromise()
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};

export const getSupplyCreeperLegacy = (res): void => {
    /* Schema to follow: {
        circulating,
        uncirculating,
        burned,
        total
        https://github.com/meltingice/nanocrawler/blob/banano_official/src/server/helpers/circulatingSupply.js
     */
    getSupplyPromise()
        .then((data) => {
            const creeperSchema = {
                circulating: data.circulatingAmount,
                uncirculating: data.devFundAmount,
                burned: data.burnedAmount,
                total: data.totalAmount - data.burnedAmount,
            };
            res.send(creeperSchema);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
