export type RepresentativeUptimeDto = {
    address: string;
    online: boolean;
    uptimePercentDay: number;
    uptimePercentWeek: number;
    uptimePercentMonth: number;
    uptimePercentSemiAnnual: number;
    uptimePercentYear: number;
    creationUnixTimestamp: number;
    creationDate: string;

    /* Not provided if representative has never been offline. */
    lastOutage?: LastOutage;
};

export type LastOutage = {
    offlineUnixTimestamp: number;
    onlineUnixTimestamp: number;
    onlineDate: string;
    offlineDate: string;
    durationMinutes: number;
};
