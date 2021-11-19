import { convertFromRaw, LOG_ERR } from '@app/services';
import { DelegatorDto, DelegatorsOverviewDto } from '@app/types';
import { delegatorsRpc } from '@app/rpc';

// TODO add option to conditionally filter out 0-balance delegators.
const getDelegatorsPromise = async (address: string): Promise<DelegatorsOverviewDto> => {
    const rpcResponse = await delegatorsRpc(address).catch((err) => {
        LOG_ERR('getDelegatorsPromise', err, { address });
        return Promise.resolve({ delegators: [] });
    });

    const delegatorsDto: DelegatorDto[] = [];
    for (const address in rpcResponse.delegators) {
        /* Filters out 0-weight delegators.  These accounts delegate weight then transfer their funds.  */
        if (rpcResponse.delegators[address] !== '0') {
            /* Filters out dust. */
            const weight = Number(convertFromRaw(rpcResponse.delegators[address]));
            if (isNaN(weight) || Number(weight.toFixed(10)) === 0) {
                continue;
            }
            delegatorsDto.push({ address, weight });
        }
    }
    const count = delegatorsDto.length;

    // Sort by weight descending
    delegatorsDto.sort((a, b) => (a.weight < b.weight ? 1 : -1));

    let weightSum = 0;

    // Get total delegated weight
    delegatorsDto.map((a) => (weightSum += a.weight));

    return {
        count,
        weightSum,
        /* Only return first 1000 delegators */
        delegators: delegatorsDto.slice(0, 1000),
    };
};

/** Returns circulating, burned, and core-team controlled supply statistics. */
export const getDelegators = async (req, res): Promise<void> => {
    const parts = req.url.split('/');
    const address = parts[parts.length - 2];
    const supply = await getDelegatorsPromise(address);
    res.send(supply);
};
