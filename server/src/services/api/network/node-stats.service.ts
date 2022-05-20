import { getPeerVersionsPromise } from './peer-versions.service';
import { HostNodeStatsDto } from '@app/types';
import { uptimeRpc } from '../../../rpc/calls/uptime.rpc';
import { blockCountRpc } from '../../../rpc/calls/block-count.rpc';
import { AppCache, HOST_NODE_STATS_PAIR, LEDGER_LOCATION } from '@app/config';
import { versionRpc } from '../../../rpc/calls/version.rpc';
import { LOG_ERR } from '../../log/error.service';
import { cacheSend } from '../../etc/generic-utils';

const getSize = require('get-folder-size');
const spawn = require('child_process');
const os = require('os');

/** Gets the ledger size, requires read permissions enabled. */
const calcLedgerSizeMB = async (): Promise<number> =>
    new Promise((resolve) => {
        getSize(LEDGER_LOCATION, (err, size) => {
            if (err) {
                LOG_ERR('getNodeStats.getLedgerSize', err);
                resolve(undefined);
            } else {
                resolve(Number((size / 1000 / 1000).toFixed(2)));
            }
        });
    });

const calcDiskSpaceGB = async (): Promise<number> =>
    new Promise((resolve) => {
        spawn.exec('node scripts/calc-avail-diskspace', (err, stdout, stderr) => {
            if (err || stderr) {
                const diskAvailableError = err || stderr;
                LOG_ERR('getNodeStatsV1.getDiskspaceAvailable', diskAvailableError);
                resolve(undefined);
            } else {
                resolve(Number(Number(stdout).toFixed(5)));
            }
        });
    });

export const getNodeStatsV1 = async (res) => {
    const freeMemoryGB = os.freemem() / 1024 / 1024 / 1024;
    const totalMemoryGB = os.totalmem() / 1024 / 1024 / 1024;
    const usedMemoryGB = totalMemoryGB - freeMemoryGB;
    const addressAsRepresentative = String(process.env.PUBLIC_REP_ADDRESS || '').trim();
    const availableDiskSpaceGB = await calcDiskSpaceGB();
    const ledgerSizeMB = await calcLedgerSizeMB();

    try {
        const peerStats = await getPeerVersionsPromise();
        let peerCount = 0;
        peerStats.map((entry) => (peerCount += entry.count));
        const uptime = await uptimeRpc();
        const blockCount = await blockCountRpc();
        const version = await versionRpc();

        let location = undefined;
        if (AppCache.monitoredReps && addressAsRepresentative) {
            for (const rep of AppCache.monitoredReps) {
                if (rep.address === addressAsRepresentative) {
                    location = rep.location;
                    break;
                }
            }
        }
        const data: HostNodeStatsDto = {
            addressAsRepresentative,
            availableDiskSpaceGB,
            cementedBlocks: Number(blockCount.cemented),
            currentBlock: Number(blockCount.count),
            ledgerSizeMB: ledgerSizeMB,
            location: location,
            nodeVendor: version.node_vendor,
            nodeUptimeSeconds: Number(uptime.seconds),
            peerCount,
            protocolVersion: version.protocol_version,
            rpcVersion: version.rpc_version,
            storeVendor: version.store_vendor,
            storeVersion: version.store_version,
            totalMemoryGB: totalMemoryGB,
            uncheckedBlocks: Number(blockCount.unchecked),
            usedMemoryGB: usedMemoryGB,
        };
        return cacheSend(res, data, HOST_NODE_STATS_PAIR);
    } catch (err) {
        LOG_ERR('getNodeStatsV1', err);
        return res.status(500).send({ error: 'Unable to get node statistics.' });
    }
};
