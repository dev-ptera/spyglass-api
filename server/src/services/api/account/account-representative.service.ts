import {accountRepresentativeRpc} from "@app/rpc";
import {LOG_ERR} from "@app/services";
import {AccountRepresentativeDto} from "../../../types/AccountRepresentativeDto";


export const getAccountRepresentativePromise = async (address: string): Promise<AccountRepresentativeDto> => {
    const accountRepRpcResponse = await accountRepresentativeRpc(address).catch((err) => {
        LOG_ERR('getAccountRepresentativePromise', err, { address });
        return Promise.reject();
    });
    return {
        representative: accountRepRpcResponse.representative
    }
};

/** For a given address, return a list of confirmed transactions. */
export const getAccountRepresentative = async (req, res): Promise<void> => {
    const parts = req.url.split('/');
    const address = parts[parts.length - 2];
    const rep = await getAccountRepresentativePromise(address);
    res.send(rep);
};
