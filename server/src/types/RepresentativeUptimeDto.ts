export type RepresentativeUptimeDto = {
    address: string;
    online: boolean;
    /* Not provided if representative has never been offline. */
    lastOutage?: LastOutage;
    pingStats?: PingStats[];
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

export type PingStats = {
    '0'?: number;
    '1'?: number;
};

export type LastOutage = {
    offlineUnixTimestamp: number;
    onlineUnixTimestamp: number;
    onlineDate: string;
    offlineDate: string;
    durationMinutes: number;
};
