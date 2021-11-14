export type RequestBody = {
    isOnline: boolean;
    isPrincipal: boolean;
    includeAlias: boolean;
    includeDelegatorCount: boolean;
    includeNodeMonitorStats: boolean;
    includeUptimeStats: boolean;
    minimumWeight: number;
    maximumWeight: number;
};

export const DEFAULT_BODY: RequestBody = {
    isOnline: false,
    isPrincipal: false,
    includeAlias: false,
    includeDelegatorCount: false,
    includeNodeMonitorStats: false,
    includeUptimeStats: false,
    minimumWeight: 10_000,
    maximumWeight: undefined,
}
