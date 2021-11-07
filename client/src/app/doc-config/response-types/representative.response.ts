export const REPRESENTATIVES_LARGE = {
    array: {
        address: 'string',
        delegatorCount: 'number',
        isOnline: 'boolean',
        isPrincipal: 'boolean',
        'nodeMonitorStats?': {
                address: 'string',
                cementedBlocks: 'number',
                confirmedBlocks: 'number',
                currentBlock: 'number',
                delegatorsCount: 'number',
                ip: 'string',
                location: 'string',
                name: 'string',
                nodeUptimeStartup: 'number',
                online: 'boolean',
                peers: 'number',
                representative: 'string',
                systemLoad: 'number',
                totalMem: 'number',
                uncheckedBlocks: 'number',
                usedMem: 'number',
                version: 'string',
                weight: 'number',
        },
        weight: 'number',
    },
};

export const REPRESENTATIVES_ONLINE = {
    array: {
        address: 'string',
    },
};

export const REPRESENTATIVES_MONITORED = {
    array: {
        address: 'string',
        cementedBlocks: 'number',
        confirmedBlocks: 'number',
        currentBlock: 'number',
        delegatorsCount: 'number',
        ip: 'string',
        location: 'string',
        name: 'string',
        nodeUptimeStartup: 'number',
        online: 'boolean',
        peers: 'number',
        representative: 'string',
        systemLoad: 'number',
        totalMem: 'number',
        uncheckedBlocks: 'number',
        usedMem: 'number',
        version: 'string',
        weight: 'number',

        //        confirmationInfo: {count: 2048, timeSpan: 412309, average: 150, percentile50: 149, percentile75: 193, percentile90: 219,…}
    },
};
