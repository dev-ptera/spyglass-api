import { AxiosError } from 'axios';
import { ErrorResponse } from '@dev-ptera/nano-node-rpc';

/** An AxiosError<ErrorResponse> implies there was an issue fetching the data from the nano RPC node.
 *  An ErrorResponse implies there was a response from the nano RPC node, but it contained an error.
 */
export const logError = (err: ErrorResponse | AxiosError<ErrorResponse>) => {
    const nodeRpcError = err as ErrorResponse;
    const axiosError = err as AxiosError<ErrorResponse>;
    if (nodeRpcError.error) {
        // Nano Node RPC error ('bad address', etc);
        console.error(`[ERROR]: ${nodeRpcError.error}`);
    } else if (axiosError.isAxiosError) {
        // Nano Proxy Server or Connectivity Error
        console.error(`[ERROR]: Proxy Server Error.`);
        console.error(`\t [url]: ${axiosError.config.url}`);
        console.error(`\t [status]: ${axiosError.response?.status || axiosError.code}`);
        console.error(`\t [response]: ${axiosError.response?.data?.error || axiosError.message}`);
        console.error(`\t [auth token]: ${axiosError.config.headers.Authorization}`);
    } else {
        // Unknown, internal to server.
        console.error(`[ERROR]: ${err}`);
    }
};

export const LOG_ERR = (
    reqType: string,
    err: ErrorResponse | AxiosError<ErrorResponse>,
    params?
): any | { error: string } => {
    console.error(`[ERROR]: Request type [${reqType}] failed.`);
    logError(err);
    if (params) {
        console.error('[ERROR]: Request parameters: ');
        for (const key in params) {
            console.error(`\t [${key}]: ${params[key]}`);
        }
    }
    console.log('________________________________________________________________');

    const nodeRpcError = err as ErrorResponse;
    const axiosError = err as AxiosError<ErrorResponse>;
    if (nodeRpcError.error) {
        return { error: nodeRpcError.error };
    } else if (axiosError.response && axiosError.response.data) {
        return { error: axiosError.response.data.error };
    } else {
        return { error: 'Internal server error' };
    }
};
