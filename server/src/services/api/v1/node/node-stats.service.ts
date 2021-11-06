import { ErrorResponse } from '@dev-ptera/nano-node-rpc';
import { getMonitoredReps, LOG_ERR } from '@app/services';
import { AppCache, HOST_NODE_NAME, LEDGER_LOCATION } from '@app/config';
import { HostNodeStatsDto, MonitoredRepDto } from '@app/types';
const getSize = require('get-folder-size');
const spawn = require('child_process');

/** Returns statistics of this explorer's host node. */
export const getNodeStats = async (req, res): Promise<void> => {
    if (!AppCache.representatives) {
        return sendRepresentativesNotLoadedError(res);
    }

    // Find the host node in the list of cached reps.
    let hostNode = findYellowSpyglassHost();
    if (!hostNode) {
        // Go fetch the monitored reps again; this is not right.
        const monitoredReps = await getMonitoredReps();
        AppCache.representatives.monitoredReps = monitoredReps;
        hostNode = findYellowSpyglassHost();
        if (!hostNode) {
            return sendRepresentativesNotLoadedError(res);
        }
    }

    // Calculate ledger size.
    let ledgerSizeMb = 0;
    getSize(LEDGER_LOCATION, (err, size) => {
        if (err) {
            LOG_ERR('getNodeStats.getLedgerSize', err);
        }
        ledgerSizeMb = Number((size / 1000 / 1000).toFixed(2));
    });

    // Calculate free space on host machine
    spawn.exec('node scripts/calc-avail-diskspace', (err, stdout, stderr) => {
        if (err || stderr) {
            const diskAvailableError = err || stderr;
            LOG_ERR('getNodeStats.getDiskspaceAvailable', diskAvailableError);
            return res.status(500).send(diskAvailableError);
        }
        const availableDiskSpaceGb = Number(Number(stdout).toFixed(5));
        return res.send({
            ...hostNode,
            ledgerSizeMb,
            availableDiskSpaceGb,
        } as HostNodeStatsDto);
    });
};

const sendRepresentativesNotLoadedError = (res): void => {
    const err: ErrorResponse = {
        error: 'Node data not loaded in AppCache.',
    };
    LOG_ERR('getNodeStats', err);
    return res.status(500).send(err);
};

const findYellowSpyglassHost = (): MonitoredRepDto => {
    let hostNode: MonitoredRepDto = undefined;
    for (const dto of AppCache.representatives.monitoredReps) {
        if (dto.name === HOST_NODE_NAME) {
            hostNode = dto;
        }
    }
    return hostNode;
};
