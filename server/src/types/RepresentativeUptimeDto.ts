export type RepresentativeUptimeDto = {
    address: string;
    online: boolean;
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
