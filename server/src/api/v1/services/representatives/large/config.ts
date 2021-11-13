export type RequestBody = {
    minimumWeight: number;
    maximumWeight: number;
    includeDelegatorCount: boolean;
};

export const DEFAULT_BODY: RequestBody = {
    includeDelegatorCount: false,
    minimumWeight: 100_000,
    maximumWeight: undefined,
}
