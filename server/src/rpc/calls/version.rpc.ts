import {NANO_CLIENT} from '@app/config';
import {VersionResponse} from "@dev-ptera/nano-node-rpc";

export const versionRpc = async (): Promise<VersionResponse> =>
    NANO_CLIENT.version()
        .then((data: VersionResponse) => Promise.resolve(data))
        .catch((err) => Promise.reject(err));
