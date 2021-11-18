export type RepresentativeDto = {
    address: string;
    weight: number;
    delegatorsCount?: number;
    nodeMonitorStats?: {
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
        systemLoad?: number;
        uncheckedBlocks?: number;
        usedMem?: number;
        version?: string;
        weight?: number;
    };
    alias?: string;
    uptimeStats?: {
        /* Not provided if representative has never been offline. */
        lastOutage?: {
            offlineUnixTimestamp: number;
            onlineUnixTimestamp: number;
            onlineDate: string;
            offlineDate: string;
            durationMinutes: number;
        };
        pings?: string;
        trackingStartUnixTimestamp: number;
        trackingStartDate: string;
        uptimePercentages: {
            day: number;
            week: number;
            month: number;
            semiAnnual: number;
            year: number;
        };
    };
};
