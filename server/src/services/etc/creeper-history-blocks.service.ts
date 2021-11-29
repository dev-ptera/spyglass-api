import { accountHistoryRpc, frontierCountRpc, frontiersRpc } from '@app/rpc';
import { LOG_ERR, LOG_INFO, sleep } from '@app/services';
import { FrontierCountResponse } from '@dev-ptera/nano-node-rpc';
import { AppCache } from '@app/config';
import axios, { AxiosResponse } from 'axios';

const fs = require('fs');

/** File which is used to store the list of top holders. */
export const BLOCKS_WITH_MISSING_TIMESTAMPS = './database/banano/blocks-with-missing-timestamp.json';
export const CREEPER_TIMESTAMPS = './database/banano/creeper-timestamps-round-2.csv';

/** Uses the frontiers RPC call to iterate through all accounts.
 * Filters out small balance accounts & proceeds to lookup remaining accounts' representative. */
export const getFrontiersDataToFindMissingTimestampBlocks = async (): Promise<string[]> => {
    const frontiersCountResponse: FrontierCountResponse = await frontierCountRpc().catch((err) => {
        return Promise.reject(LOG_ERR('getFrontiersData.getFrontiersCount', err));
    });
    const frontiersResponse = await frontiersRpc(Number(frontiersCountResponse.count)).catch((err) => {
        return Promise.reject(LOG_ERR('getFrontiersData.getFrontiers', err));
    });

    const missing = [];
    let i = 0;
    for (const address in frontiersResponse.frontiers) {
        try {
            if (
                address === 'ban_1jung1eb3uomk1gsx7w6w7toqrikxm5pgn5wbsg5fpy96ckpdf6wmiuuzpca' ||
                address === 'ban_1faucetjuiyuwnz94j4c7s393r95sk5ac7p5usthmxct816osgqh3qd1caet'
            ) {
                continue;
            }

            const accountTx = await accountHistoryRpc(address, 0, -1).catch((err) => {
                return Promise.reject(LOG_ERR('getConfirmedTransactions', err, { address }));
            });

            // If we have ran out of search results, it's time to exit.
            if (!accountTx.history || accountTx.history.length === 0) {
                break;
            }

            for (const tx of accountTx.history) {
                if (!AppCache.historicHashes.has(tx.hash) && Number(tx.local_timestamp) < 1616158800) {
                    // This hash SHOULD have been added...
                    missing.push(tx.hash);
                    i++;

                    if (i % 1000 === 0) {
                        console.log(i);
                    }
                }
            }
        } catch (err) {
            console.error(err);
            continue;
        }
    }
    console.log('fronttiers logaded');
    console.log(missing.length);
    return Promise.resolve(missing);
};

const fetchCreeperTimestamp = (blocks: string[]): Promise<any> => {
    const body = {
        action: 'blocks_info',
        hashes: blocks,
        json_block: 'true',
    };
    return new Promise<any>((resolve, reject) => {
        axios
            .request({
                method: 'POST',
                url: `http://159.69.198.59:7070`,
                data: body,
            })
            .then((response: AxiosResponse<any>) => resolve(response.data))
            .catch(reject);
    });
};

export const populateBlockTimestamps = async (missingBlocks: string[]): Promise<void> => {
    const start = LOG_INFO('Searching for Missing Block Timestamps');

    const entries = [];
    let reqBody = [];
    const reqBodySize = 200;
    for (const block of missingBlocks) {
        reqBody.push(block);

        // Send a request for every 200 blocks
        if (reqBody.length === reqBodySize) {
            const blocksInfo = await fetchCreeperTimestamp(reqBody).catch((err) => {
                console.error(err);
            });
            reqBody = [];

            if (!blocksInfo || !blocksInfo.blocks) {
                continue;
            }

            for (const hash in blocksInfo.blocks) {
                const timestamp = blocksInfo.blocks[hash].local_timestamp;
                entries.push(`${hash},${timestamp}`);

                // Save progress every 100000 items.
                if (entries.length % 100000 === 0) {
                    var file = fs.createWriteStream(CREEPER_TIMESTAMPS);
                    file.on('error', function (err) {
                        /* error handling */
                    });
                    entries.forEach(function (v) {
                        file.write(v + '\n');
                    });
                    file.end();
                }
            }

            if (entries.length % 1000 === 0) {
                console.log(entries.length);
            }
        }
    }

    var file = fs.createWriteStream(CREEPER_TIMESTAMPS);
    file.on('error', function (err) {
        /* error handling */
    });
    entries.forEach(function (v) {
        file.write(v + '\n');
    });
    file.end();

    LOG_INFO('Searching for missing block timestamps Blocks Updated', start);
};

/** Given a Block Snapshot from Creeper, find any missing blocks. */
//4891316 missing originally
export const findMissingBlocks = async (): Promise<void> => {
    return new Promise((resolve) => {
        const start = LOG_INFO('Searching for Missing Blocks');
        getFrontiersDataToFindMissingTimestampBlocks()
            .then((data) => {
                fs.writeFile(BLOCKS_WITH_MISSING_TIMESTAMPS, JSON.stringify(data), { flag: 'w' }, (err) => {
                    if (err) {
                        LOG_ERR('findMissingBlocks.writeFile', err);
                    }
                });
                const used = process.memoryUsage();
                for (let key in used) {
                    console.log(`${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`);
                }
                resolve(LOG_INFO('Missing Blocks Updated', start));
            })
            .catch((err) => {
                LOG_ERR('findMissingBlocks', err);
                resolve();
            });
    });
};

export const findMissingBlocks2 = async (): Promise<void> => {
    return new Promise((resolve) => {
        const start = LOG_INFO('Searching for Missing Blocks');

        let rawdata = fs.readFileSync('./database/banano/blocks-with-missing-timestamp.json');
        let wasMissing = JSON.parse(rawdata);

        console.log('parsed');

        const missing = new Set<string>();
        for (const maybeMiss of wasMissing) {
            if (!AppCache.historicHashes.has(maybeMiss)) {
                missing.add(maybeMiss);
            }
        }

        populateBlockTimestamps(Array.from(missing.values()));
    });
};
