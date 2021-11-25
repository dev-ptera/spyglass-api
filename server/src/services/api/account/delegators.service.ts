import { convertFromRaw, LOG_ERR } from '@app/services';
import { DelegatorDto, DelegatorsOverviewDto } from '@app/types';
import { delegatorsCountRpc, delegatorsRpc } from '@app/rpc';

type RequestBody = {
    address: string;
    offset?: number;
    count?: number;
    showZeroBalance?: boolean;
    threshold?: number;
};

const DEFAULT_BODY: RequestBody = {
    address: '',
    offset: 0,
    count: 100,
    threshold: 0.0001,
};

const setBodyDefaults = (body: RequestBody): void => {
    // Set defaults
    if (body.offset === undefined) {
        body.offset = DEFAULT_BODY.offset;
    }
    if (body.count === undefined) {
        body.count = DEFAULT_BODY.count;
    }
    if (body.threshold === undefined) {
        body.threshold = DEFAULT_BODY.threshold;
    }
};

const getDelegatorsPromise = async (body: RequestBody): Promise<DelegatorsOverviewDto> => {
    setBodyDefaults(body);
    const address = body.address;
    const maxResponseLength = Number(body.count);

    // Fetch delegators count.
    const delegatorsCount = await delegatorsCountRpc(address).catch((err) => {
        LOG_ERR('getDelegatorsPromise.delegatorsCountRpc', err, { address });
        return Promise.reject();
    });
    const count = Number(delegatorsCount.count);

    // Fetch delegators: TODO: V23 this rpc command changes; adds new optional params to make life easier.
    const rpcResponse = await delegatorsRpc(address).catch((err) => {
        LOG_ERR('getDelegatorsPromise', err, { address });
        return Promise.resolve({ delegators: [] });
    });

    // Loop through rpc results, filter out zero weight delegators
    const unfilteredDelegators: DelegatorDto[] = [];
    for (const address in rpcResponse.delegators) {
        if (rpcResponse.delegators[address] === '0' && body.threshold === 0) {
            unfilteredDelegators.push({ address, weight: 0 });
        } else {
            const weight = Number(convertFromRaw(rpcResponse.delegators[address]));
            unfilteredDelegators.push({ address, weight });
        }
    }

    // Get total delegated weight
    let weightSum = 0;
    unfilteredDelegators.map((a) => (weightSum += a.weight));

    // Sort by weight descending
    unfilteredDelegators.sort((a, b) => (a.weight < b.weight ? 1 : -1));

    //TODO: In v23, this logic will be revisited.
    const delegators: DelegatorDto[] = [];

    // Filter results manually using threshold.
    for (const unfilteredDelegator of unfilteredDelegators.slice(body.offset)) {
        if (unfilteredDelegator.weight >= body.threshold) {
            delegators.push(unfilteredDelegator);
            if (delegators.length === maxResponseLength) {
                break;
            }
        }
    }

    return {
        count,
        weightSum,
        delegators,
    };
};

/** Returns circulating, burned, and core-team controlled supply statistics. */
export const getDelegators = async (req, res): Promise<void> => {
    const supply = await getDelegatorsPromise(req.body);
    res.send(supply);
    return Promise.resolve();
};
