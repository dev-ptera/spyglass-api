

export type RepresentativeUptimeDto = {
    address: string;
    online: boolean;
    uptimePercentages: {
        day: number;
        week: number;
        month: number;
        semiAnnual: number;
        year: number;
    };

    /* Not provided if representative has never been offline. */
    lastOutage?: LastOutage;
    trackingStartUnixTimestamp: number;
    trackingStartDate: string;
    pings?: string;
};

export type LastOutage = {
    offlineUnixTimestamp: number;
    onlineUnixTimestamp: number;
    onlineDate: string;
    offlineDate: string;
    durationMinutes: number;
};
