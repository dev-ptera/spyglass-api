import { accountBlockCountRpc, accountHistoryRpc, frontierCountRpc, frontiersRpc } from '@app/rpc';
import {LOG_ERR, LOG_INFO, sleep} from '@app/services';
import { FrontierCountResponse } from '@dev-ptera/nano-node-rpc';

const fs = require('fs');
const TIMESTAMPS_BACKUP = './database/banano/all-timestamps.json';
const blockTimestamps: BlockTimestamp[] = [];
let blocksFetched = 0;

type BlockTimestamp = {
    hash: string;
    timestamp: number;
};

/** Fetches account history in 10_000 transaction increments, tracking balance & sender/receiver info. */
const iterateAccountHistory = async (
    address: string,
    blockCount: number
): Promise<void> => {
    const accountHistoryCalls = [];
    let blocksRequested = 0;
    const transactionsPerRequest = 10_000;
    while (blocksRequested < blockCount) {
        accountHistoryCalls.push(accountHistoryRpc(address, blocksRequested, transactionsPerRequest, true));
        blocksRequested += transactionsPerRequest;
    }

    let i = 0;
    for (const request of accountHistoryCalls) {
        const accountHistory = await request.catch((err) =>
            Promise.reject(LOG_ERR('iterateAccountHistory', err, { address }))
        );

        // Sleep between subsequent RPC calls.
        if (i === 1) {
            await sleep(1000);
        }
        if (i !== 0) {
            i++;
        }

        /* Iterate through the list of transactions, perform insight calculations. */
        for (const transaction of accountHistory.history) {
            blocksFetched++;
            blockTimestamps.push({
                hash: transaction.hash,
                timestamp: transaction.local_timestamp,
            });
            if (blocksFetched % 1000 === 0) {
                console.log(blocksFetched);
            }
        }
    }
};

export const findFrontiers = async (): Promise<void> => {
    const frontiersCountResponse: FrontierCountResponse = await frontierCountRpc().catch((err) => {
        return Promise.reject(LOG_ERR('getFrontiersData.getFrontiersCount', err));
    });
    console.log('frontiers count');
    const frontiersResponse = await frontiersRpc(Number(frontiersCountResponse.count)).catch((err) => {
        return Promise.reject(LOG_ERR('getFrontiersData.getFrontiers', err));
    });

    console.log('frontiers loaded');


    for (const address in frontiersResponse.frontiers) {
        try {
            const blockCountResponse = await accountBlockCountRpc(address).catch((err) =>
                Promise.reject(LOG_ERR('getAccountInsights.accountBlockCountRpc', err, { address }))
            );
            const blockCount = Number(blockCountResponse.block_count);
            await iterateAccountHistory(address, blockCount);
        } catch (err) {
            console.error(err);
            continue;
        }
    }
    return Promise.resolve();
};

/** Iterates through all the Blocks in a nodes database and writes the [BLOCK, TIMESTAMP] to a CSV.
 *
 *  [Warning] this script is slow as hell & not recommended.  Just read from the LMDB database directly.
 *  DOES NOT WORK.  Account History RPC just fails for large accounts like JungleTV.
 * */
export const exportTimestamps = async (): Promise<void> => {
    const start = LOG_INFO('Exporting timestamps to a CSV.');
    await findFrontiers();
    LOG_INFO('Fetched all timestamps.', start);
    const entries = [];
    for (const block of blockTimestamps) {
        entries.push(`${block.hash},${block.timestamp}`);

        // Save progress every 100000 items.
        if (entries.length % 100000 === 0) {
            var file = fs.createWriteStream(TIMESTAMPS_BACKUP);
            file.on('error', function (err) {
                /* error handling */
            });
            entries.forEach(function (v) {
                file.write(v + '\n');
            });
            file.end();
        }
    }
};
