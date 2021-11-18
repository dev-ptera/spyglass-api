export type MonitoredRepresentativeDto = {
    address: string;
    cementedBlocks?: number;
    confirmationInfo?: {
        average: number;
    };
    currentBlock?: number;
    location?: string;
    ip?: string;
    name?: string;
    nodeUptimeStartup?: number;
    online?: boolean;
    representative?: string;
    peers?: number;
    totalMem?: number;
    systemLoad: number;
    uncheckedBlocks?: number;
    usedMem?: number;
    version?: string;
    weight?: number;
};
