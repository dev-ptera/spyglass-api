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

    console.log(body);

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
        delegators: delegators.splice(body.offset).slice(0, body.count)
    };
};

/** Given an address, returns a list of delegators. */
export const getDelegators = async (req, res): Promise<void> => {
    const delegators = await getDelegatorsPromise(req.body);
    res.send(delegators);
    return Promise.resolve();
};
