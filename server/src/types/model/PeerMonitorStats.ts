export type PeerMonitorStats = {
    nanoNodeAccount: string;
    nanoNodeName: string;
    version: string;
    currentBlock: number;
    uncheckedBlocks: number;
    cementedBlocks: number;
    confirmedBlocks: number;
    votingWeight: number;
    numPeers: number;
    nodeMonitorVersion: string;
    systemUptime: string;
    usedMem: number;
    totalMem: number;
    confirmationInfo: {
        average: number;
    };
    repAccount: string;
    systemLoad: number;
    nodeUptimeStartup: number;
    nodeLocation: string;
} & { ip: string };
