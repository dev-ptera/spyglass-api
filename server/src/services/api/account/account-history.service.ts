import { accountHistoryRpc } from '@app/rpc';
import {LOG_ERR, LOG_INFO, sleep} from '@app/services';
import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';
import {performance} from "perf_hooks";

export type RpcConfirmedTransaction = AccountHistoryResponse['history'][0];

export type IterateHistoryConfig = {
    address: string;
    offset?: number; // The number of records to skip before starting the search, defaults to 0.
    blockCount?: number; // The number of records to iterate, defaults to all.
    transactionsPerRequest?: number; // Defaults to 10,000
    hasTerminatedSearch?: boolean; // This can be used to cancel the account history iteration.
    reverse?: boolean; // Start counting from 0 block height instead of current account block height, defaults to false;
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
    const offset = config.offset || 0;
    const blockCount = config.blockCount;
    const transactionsPerRequest = config.transactionsPerRequest || 10_000;

    let totalBlocksRequested = 0;
    let totalTransactionsCounted = 0;
    let resume = true;
    let head: string;

    const totalStart =  performance.now();
    while (resume) {

        // Make the RPC call.
        const accountHistory = await accountHistoryRpc(
            address,
            head ? 1 : offset,  // If we have a head block to use, manually set the offset.
            transactionsPerRequest,
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
        const hasExceededRequestedBlocks = blockCount && totalBlocksRequested >= blockCount;
        const hasSearchedAllBlocks = accountHistory.history.length < transactionsPerRequest;
        resume = !config.hasTerminatedSearch && !hasExceededRequestedBlocks && !hasSearchedAllBlocks;
    }
    LOG_INFO(`Insights Loaded of size: ${totalTransactionsCounted}`, totalStart);
};
