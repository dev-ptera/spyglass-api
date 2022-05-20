export type HostNodeStatsDto = {
    addressAsRepresentative?: string;
    peerCount: number;
    currentBlock: number;
    cementedBlocks: number;
    uncheckedBlocks: number;
    usedMemoryGB?: number;
    totalMemoryGB?: number;
    ledgerSizeMB?: number;
    availableDiskSpaceGB?: number;
    nodeUptimeSeconds: number;
    location?: string;
    rpcVersion: string;
    storeVersion: string;
    protocolVersion: string;
    nodeVendor: string;
    storeVendor: string;
};
