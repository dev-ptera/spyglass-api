import {MonitoredRepresentativeDto} from "@app/types";

export type AppCache = {

    /** Online representatives, refreshed every minute. */
    onlineReps: Set<string>,

    /** Representatives that run the Nano Node Monitor software. */
    monitoredReps: Array<MonitoredRepresentativeDto>,
};

export const AppCache: AppCache = {
    onlineReps: new Set<string>(),
    monitoredReps: []
}
