import { accountRepresentativeRpc } from '@app/rpc';
import { isValidAddress, LOG_ERR } from '@app/services';
import { AccountRepresentativeDto } from '@app/types';

/** Uses RPC command to fetch an account's representative. */
export const getAccountRepresentativePromise = async (address: string): Promise<AccountRepresentativeDto> => {
    const accountRepRpcResponse = await accountRepresentativeRpc(address).catch((err) => {
        return Promise.reject(LOG_ERR('getAccountRepresentativePromise', err, { address }));
    });
    return {
        representative: accountRepRpcResponse.representative,
    };
};

/** Returns an accounts representative. */
export const getAccountRepresentativeV1 = (req, res): void => {
    const parts = req.url.split('/');
    const address = parts[parts.length - 1];
    if (!isValidAddress(address)) {
        return res.status(500).send({ error: 'Address is required' });
    }
    getAccountRepresentativePromise(address)
        .then((rep) => {
            res.send(rep);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
