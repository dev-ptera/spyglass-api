export type RepresentativeUptimeDto = {
    address: string;
    online: boolean;
    /* Not provided if representative has never been offline. */
    lastOutage?: LastOutage;
    /** Each PingStat represents the representative online/offline status evaluated every minute.  Current state can be found at the end of the array.
     *
     * e.g. `[{ 1: 5 }, { 0: 10 }]` can be read as "The representative was online for 5 minutes, and has fallen offline for 10 minutes.
     * */
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

/** `1` is `online` & `0` is `offline`. */
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
