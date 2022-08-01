import { accountHistoryRpc } from '@app/rpc';
import { LOG_ERR, LOG_INFO } from '@app/services';
import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';
import { performance } from 'perf_hooks';

export type RpcConfirmedTransaction = AccountHistoryResponse['history'][0];

export type IterateHistoryConfig = {
    address: string;
    // The number of records to iterate.
    blockCount: number;
    // The number of records to skip, relateive to the starting block.  Starting block can either be at account_block_height or 0, relative to the reverse prop.
    offset?: number;
    // Defaults to 10,000
    transactionsPerRequest?: number;
    // This can be used to cancel the account history iteration.
    hasTerminatedSearch?: boolean;
    // Start counting from 0 block height instead of current account block height, defaults to false;
    reverse?: boolean;
    // Raw RPC account_history param, includes change blocks & adds more complex return data type https://docs.nano.org/commands/rpc-protocol/#account_history
    raw?: boolean;
    // Search results happening before this block number shall be omitted.
    minBlock?: number;
    // Search results happening after this block number shall be omitted.
    maxBlock?: number;
};

/** Iterates through an account's confirmed transaction history & for each transaction, performs a callback action.
 *
 *  Instead of performing a single, potentially large call, this function
 *  makes multiple `account_history` RPC calls to iterate through an account's history.
 * */
export const iterateHistory = async (
    config: IterateHistoryConfig,
    callback: (tx: RpcConfirmedTransaction) => void
): Promise<void> => {
    const address = config.address;
    const minBlock = config.minBlock || 0;
    const maxBlock = config.maxBlock || config.blockCount;
    const offset = config.offset || 0;
    const blockCount = config.blockCount;
    const transactionsPerRequest = config.transactionsPerRequest || 10_000;

    let totalBlocksRequested = 0;
    let totalTransactionsCounted = 0;
    let terminateSearch = false;
    let hasExceededBlockRange = false;
    let head: string;

    const totalStart = performance.now();

    let startBlockNumber = offset;
    if (!config.reverse && maxBlock && !offset) {
        startBlockNumber = offset + (blockCount - maxBlock);
    }
    if (config.reverse && minBlock && !offset) {
        startBlockNumber = offset + minBlock - 1;
    }

    while (!terminateSearch) {
        // Make the RPC call.
        const accountHistory = await accountHistoryRpc(
            // TODO: Pass this in as a config object.
            address,
            head ? 1 : startBlockNumber, // If we have a head block to use, manually set the offset.
            transactionsPerRequest,
            config.raw,
            config.reverse,
            head
        ).catch((err) => Promise.reject(LOG_ERR('iterateHistory.accountHistoryRpc', err, { address })));

        // Check if anything is weird.
        if (!accountHistory || !accountHistory.history || accountHistory.history.length === 0) {
            break;
        }

        // Allow the callback per transaction to happen.
        accountHistory.history.map((tx) => {
            // Tip:
            // If a block is missing in an account history, take the height difference between every block & its next.
            // If the difference is not 1, there is a missing block.

            // Have we exceeded our block range?
            const height = Number(tx.height);
            if (config.reverse) {
                if (height > maxBlock) {
                    hasExceededBlockRange = true;
                    return;
                }
            } else {
                if (height < minBlock) {
                    hasExceededBlockRange = true;
                    return;
                }
            }

            if (config.hasTerminatedSearch) {
                return;
            }
            try {
                callback(tx);
                head = tx.hash;
                totalTransactionsCounted++;
            } catch (err) {
                LOG_ERR('iterateHistory', err);
            }
        });

        // Check to see if we should perform the next account_history RPC call.
        totalBlocksRequested += transactionsPerRequest;
        const hasSearchedAllBlocks = accountHistory.history.length < transactionsPerRequest;
        terminateSearch =
            hasExceededBlockRange
            || hasSearchedAllBlocks
            || config.hasTerminatedSearch;
    }
    LOG_INFO(`History Loaded of size: ${totalTransactionsCounted}`, totalStart);
};
