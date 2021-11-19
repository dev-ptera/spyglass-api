import { convertFromRaw, LOG_ERR } from '@app/services';
import { DelegatorDto, DelegatorsOverviewDto } from '@app/types';
import { delegatorsRpc } from '@app/rpc';
import { DelegatorsResponse } from '@dev-ptera/nano-node-rpc';

const delegatorsPromise = (address: string): Promise<DelegatorsOverviewDto> =>
    delegatorsRpc(address)
        .then((delegatorsResponse: DelegatorsResponse) => {
            const delegatorsDto: DelegatorDto[] = [];
            for (const key in delegatorsResponse.delegators) {
                /* Filters out 0-weight delegators.  These accounts delegate weight then transfer their funds.  */
                if (delegatorsResponse.delegators[key] !== '0') {
                    /* Filters out dust. */
                    const weight = Number(convertFromRaw(delegatorsResponse.delegators[key]));
                    if (isNaN(weight) || Number(weight.toFixed(10)) === 0) {
                        continue;
                    }
                    delegatorsDto.push({
                        address: key,
                        weight,
                    });
                }
            }
            const count = delegatorsDto.length;

            // Sort by weight descending
            delegatorsDto.sort((a, b) => (a.weight < b.weight ? 1 : -1));

            let weightSum = 0;
            // Get total delegated weight
            delegatorsDto.map((a) => (weightSum += a.weight));

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

/** Returns circulating, burned, and core-team controlled supply statistics. */
export const getDelegators = async (req, res): Promise<void> => {
    const parts = req.url.split('/');
    const address = parts[parts.length - 1];
    const supply = await delegatorsPromise(address);
    res.send(supply);
};
