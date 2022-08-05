import { getPeerVersionsPromise } from './peer-versions.service';
import { HostNodeStatsDto } from '@app/types';
import { uptimeRpc, blockCountRpc, versionRpc } from '@app/rpc';
import { AppCache, HOST_NODE_STATS_PAIR } from '@app/config';
import { getLedgerSizePromise, LOG_ERR } from '@app/services';

const spawn = require('child_process');
const os = require('os');

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

export const getNodeStatsPromise = async (): Promise<HostNodeStatsDto> => {
    if (AppCache.temp.has(HOST_NODE_STATS_PAIR.key)) {
        return AppCache.temp.get(HOST_NODE_STATS_PAIR.key);
    }

    const freeMemoryGB = os.freemem() / 1024 / 1024 / 1024;
    const totalMemoryGB = os.totalmem() / 1024 / 1024 / 1024;
    const usedMemoryGB = totalMemoryGB - freeMemoryGB;
    const addressAsRepresentative = String(process.env.PUBLIC_REP_ADDRESS || '').trim();
    const availableDiskSpaceGB = await calcDiskSpaceGB();
    const ledgerSize = await getLedgerSizePromise();

    const peerStats = await getPeerVersionsPromise();
    let peerCount = 0;
    peerStats.map((entry) => (peerCount += entry.count));
    const uptime = await uptimeRpc();
    const blockCount = await blockCountRpc();
    const version = await versionRpc();

    let location = undefined;
    let monitorUrl = undefined;
    if (AppCache.monitoredReps && addressAsRepresentative) {
        for (const rep of AppCache.monitoredReps) {
            if (rep.address === addressAsRepresentative) {
                location = rep.location;
                monitorUrl = rep.ip;
                break;
            }
        }
    }
    const data: HostNodeStatsDto = {
        addressAsRepresentative,
        availableDiskSpaceGB,
        cementedBlocks: Number(blockCount.cemented),
        currentBlock: Number(blockCount.count),
        ledgerSizeMB: ledgerSize ? ledgerSize.ledgerSizeMB : undefined,
        location: location,
        nodeVendor: version.node_vendor,
        nodeUptimeSeconds: Number(uptime.seconds),
        monitorUrl,
        peerCount,
        protocolVersion: version.protocol_version,
        rpcVersion: version.rpc_version,
        storeVendor: version.store_vendor,
        storeVersion: version.store_version,
        totalMemoryGB: totalMemoryGB,
        uncheckedBlocks: Number(blockCount.unchecked),
        usedMemoryGB: usedMemoryGB,
    };

    AppCache.temp.put(HOST_NODE_STATS_PAIR.key, data, HOST_NODE_STATS_PAIR.duration);
    return data;
};

export const getNodeStatsV1 = async (res) => {
    try {
        const data = await getNodeStatsPromise();
        res.send(data);
    } catch (err) {
        LOG_ERR('getNodeStatsV1', err);
        return res.status(500).send({ error: 'Unable to get node statistics.' });
    }
};
