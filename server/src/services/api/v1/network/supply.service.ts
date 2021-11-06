import { NANO_CLIENT } from '@app/config';
import { SupplyDto } from '@app/types';
import { convertToBan, LOG_ERR } from '@app/services';

export const getSupplyPromise = (): Promise<SupplyDto> => {
    const burnAddress1 = 'ban_1burnbabyburndiscoinferno111111111111111111111111111aj49sw3w';
    const burnAddress2 = 'ban_1ban116su1fur16uo1cano16su1fur16161616161616161616166a1sf7xw';

    const devFundAddress1 = 'ban_3fundbxxzrzfy3k9jbnnq8d44uhu5sug9rkh135bzqncyy9dw91dcrjg67wf';
    const devFundAddress2 = 'ban_1fundm3d7zritekc8bdt4oto5ut8begz6jnnt7n3tdxzjq3t46aiuse1h7gj';

    return Promise.all([
        NANO_CLIENT.available_supply().then((data) => convertToBan(data.available)),
        NANO_CLIENT.account_balance(burnAddress1).then((data) => convertToBan(data.pending)),
        NANO_CLIENT.account_balance(burnAddress2).then((data) => convertToBan(data.pending)),
        NANO_CLIENT.account_balance(devFundAddress1).then((data) => convertToBan(data.balance)),
        NANO_CLIENT.account_balance(devFundAddress2).then((data) => convertToBan(data.balance)),
    ])
        .then((results: number[]) => {
            const available = Number(results[0]);
            const burned = Number(results[1]) + Number(results[2]);
            const devFund = Number(results[3]) + Number(results[4]);
            const total = available - burned;
            const circulating = available - burned - devFund;
            return Promise.resolve({
                totalAmount: total,
                circulatingAmount: circulating,
                devFundAmount: devFund,
                burnedAmount: burned,
                circulatingPercent: circulating / total,
                devFundPercent: devFund / total,
            });
        })
        .catch((err) => Promise.reject(err));
};

/** Returns circulating, burned, and core-team controlled supply statistics. */
export const getSupply = (req, res): void => {
    getSupplyPromise()
        .then((supply: SupplyDto) => {
            res.send(supply);
        })
        .catch((err) => {
            res.status(500).send(LOG_ERR('getSupply', err));
        });
};
