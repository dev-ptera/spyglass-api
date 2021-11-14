export type RequestBody = {
    isOnline: boolean;
    isPrincipal: boolean;
    includeDelegatorCount: boolean;
    includeNodeMonitorStats: boolean;
    includeUptimeStats: boolean;
    minimumWeight: number;
    maximumWeight: number;
};

export const DEFAULT_BODY: RequestBody = {
    isOnline: false,
    isPrincipal: false,
    includeDelegatorCount: false,
    includeNodeMonitorStats: false,
    includeUptimeStats: false,
    minimumWeight: 10_000,
    maximumWeight: undefined,
}
