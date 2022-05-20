import { convertFromRaw, getRepresentativesPromise, isValidAddress, LOG_ERR, LOG_INFO, sleep } from '@app/services';
import { DelegatorDto, DelegatorsOverviewDto } from '@app/types';
import { delegatorsCountRpc, delegatorsRpc } from '@app/rpc';
import { AppCache } from '@app/config';

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
    try {
        const delegatorsCount = await delegatorsCountRpc(address);
        return Number(delegatorsCount.count);
    } catch (err) {
        return Promise.reject(LOG_ERR('getDelegatorsPromise.delegatorsCount', err, { address }));
    }
};

export const getDelegatorsPromise = async (body: RequestBody): Promise<DelegatorsOverviewDto> => {
    setBodyDefaults(body);
    const address = body.address;

    if (!address) {
        return Promise.reject({ errorMsg: 'Address is required.', errorCode: 1 });
    }

    if (!isValidAddress(address)) {
        return Promise.reject({ errorMsg: 'Address is invalid.', errorCode: 2 });
    }

    // Fetch delegators count.
    let count = 0;
    try {
        count = await getDelegatorsCountPromise(address);
    } catch (err) {
        return Promise.reject(LOG_ERR('getDelegatorsPromise.getDelegatorsCountPromise', err, { address }));
    }

    // Fetch delegators
    let rpcResponse;
    try {
        rpcResponse = await delegatorsRpc(address, '10000000000000000000000000');
    } catch (err) {
        return Promise.reject(LOG_ERR('getDelegatorsPromise.delegatorsRpc', err, { address }));
    }

    // Loop through rpc results, filter out zero weight delegators
    let weightSum = 0;
    let fundedCount = 0;
    const delegators: DelegatorDto[] = [];

    for (const address in rpcResponse.delegators) {
        const weight = Number(convertFromRaw(rpcResponse.delegators[address]));
        weightSum += weight;
        if (weight >= body.threshold) {
            fundedCount++;
            if (body.size > 0) {
                delegators.push({ address, weight });
            }
        }
    }

    // Sort by weight descending
    delegators.sort((a, b) => (a.weight < b.weight ? 1 : -1));

    return {
        count,
        fundedCount,
        emptyCount: count - fundedCount,
        weightSum,
        delegators: delegators.splice(body.offset).slice(0, body.size),
    };
};

/** Given an address, returns a list of delegators. */
export const getDelegatorsV1 = (req, res): void => {
    getDelegatorsPromise(req.body)
        .then((delegators) => {
            res.send(delegators);
        })
        .catch((err) => {
            if (err.errorCode === 1) {
                return res.status(400).send(err);
            }
            if (err.errorCode === 2) {
                return res.status(400).send(err);
            }
            LOG_ERR('getDelegatorsV1', err);
            return res.status(500).send({ errorMsg: 'Internal Error' });
        });
};

/** Refreshes the list of delegators vs fundedDelegetors. */
export const cacheDelegatorsCount = async (): Promise<void> => {
    const start = LOG_INFO('Refreshing Delegator Count Cache');
    const repResponse = await getRepresentativesPromise({ minimumWeight: 100_000 });
    const addresses = [];
    repResponse.map((rep) => {
        addresses.push(rep.address);
    });

    await populateDelegatorsCount(addresses, true);
    LOG_INFO('Delegator Cache Count Updated', start);
};

/** Given a list of representatives, updates the delegator count cache if `ignoreCache` is not specified.  */
const populateDelegatorsCount = async (reps: string[], overwriteCache?: boolean): Promise<void> => {
    const delegatorCountPromises: Promise<void>[] = [];

    for (const address of reps) {
        if (!AppCache.delegatorCount.has(address) || overwriteCache) {
            delegatorCountPromises.push(
                getDelegatorsPromise({ address, size: 0 }).then((data: DelegatorsOverviewDto) => {
                    AppCache.delegatorCount.set(address, { total: data.count, funded: data.fundedCount });
                })
            );
        }
    }

    try {
        for (const updateCachePromise of delegatorCountPromises) {
            await updateCachePromise.then();
            await sleep(250);
        }
    } catch (err) {
        LOG_ERR('populateDelegatorsCount', err);
    }
};
