import { convertFromRaw, isValidAddress, LOG_ERR } from '@app/services';
import { DelegatorDto, DelegatorsOverviewDto } from '@app/types';
import { delegatorsCountRpc, delegatorsRpc } from '@app/rpc';

type RequestBody = {
    address: string;
    offset?: number;
    size?: number;
    showZeroBalance?: boolean;
    threshold?: number;
};

const DEFAULT_BODY: RequestBody = {
    address: '',
    offset: 0,
    size: 100,
    threshold: 0.0001,
};

const setBodyDefaults = (body: RequestBody): void => {
    if (body.offset === undefined) {
        body.offset = DEFAULT_BODY.offset;
    }
    if (body.size === undefined) {
        body.size = DEFAULT_BODY.size;
    }
    if (body.threshold === undefined) {
        body.threshold = DEFAULT_BODY.threshold;
    }
};

export const getDelegatorsCountPromise = async (address): Promise<number> => {
    const delegatorsCount = await delegatorsCountRpc(address).catch((err) => {
        return Promise.reject(LOG_ERR('getDelegatorsPromise.delegatorsCount', err, { address }));
    });
    return Number(delegatorsCount.count);
};

const getDelegatorsPromise = async (body: RequestBody): Promise<DelegatorsOverviewDto> => {
    setBodyDefaults(body);
    const address = body.address;

    if (!isValidAddress(address)) {
        return Promise.reject(LOG_ERR('getDelegatorsPromise', { error: 'Address is required' }));
    }

    // Fetch delegators count.
    const count = await getDelegatorsCountPromise(address).catch((err) => Promise.reject(err));

    // Fetch delegators: TODO: V23 this rpc command changes; adds new optional params to make life easier.
    const rpcResponse = await delegatorsRpc(address).catch((err) => {
        return Promise.reject(LOG_ERR('getDelegatorsPromise.delegatorsRpc', err, { address }));
    });

    // Loop through rpc results, filter out zero weight delegators
    const delegators: DelegatorDto[] = [];
    let weightSum = 0;
    let emptyCount = 0;
    for (const address in rpcResponse.delegators) {
        if (rpcResponse.delegators[address] === '0') {
            emptyCount++;
        } else {
            const weight = Number(convertFromRaw(rpcResponse.delegators[address]));
            weightSum += weight;
            if (weight >= body.threshold) {
                delegators.push({ address, weight });
            }
        }
    }

    // Sort by weight descending
    delegators.sort((a, b) => (a.weight < b.weight ? 1 : -1));

    return {
        count,
        emptyCount,
        weightSum,
        delegators: delegators.splice(body.offset).slice(0, body.size),
    };
};

/** Given an address, returns a list of delegators. */
export const getDelegators = (req, res): void => {
    getDelegatorsPromise(req.body)
        .then((delegators) => {
            res.send(delegators);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};