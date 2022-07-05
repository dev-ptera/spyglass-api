import { accountHistoryRpc } from '@app/rpc';
import { LOG_ERR, sleep } from '@app/services';
import { AccountHistoryResponse } from '@dev-ptera/nano-node-rpc';

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
    let resume = true;
    while (resume) {
        // Make the RPC call.
        const startBlock = offset + totalBlocksRequested;
        const accountHistory = await accountHistoryRpc(
            address,
            startBlock,
            transactionsPerRequest,
            config.reverse
        ).catch((err) => Promise.reject(LOG_ERR('iterateHistory.accountHistoryRpc', err, { address })));

        // Check if anything is weird.
        if (!accountHistory || !accountHistory.history || accountHistory.history.length === 0) {
            break;
        }

        // Allow the callback per transaction to happen.
        accountHistory.history.map((tx) => {
            if (config.hasTerminatedSearch) {
                return;
            }
            callback(tx);
        });

        // Check to see if we should perform the next account_history RPC call.
        totalBlocksRequested += transactionsPerRequest;
        const hasExceededRequestedBlocks = blockCount && totalBlocksRequested >= blockCount;
        const hasSearchedAllBlocks = accountHistory.history.length < transactionsPerRequest;
        resume = !config.hasTerminatedSearch && !hasExceededRequestedBlocks && !hasSearchedAllBlocks;

        // If performing a subsequent call, sleep for a moment.
        if (resume) {
            await sleep(500);
        }
    }
};
