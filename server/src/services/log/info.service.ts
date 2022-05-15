import { IS_PRODUCTION } from '@app/config';

const { performance } = require('perf_hooks');

const calcTimeDifference = (now: number, start: number): string => {
    const ms = Math.round(now - start);
    if (ms > 10000) {
        return `${Math.round(ms) / 1000} seconds`;
    }
    return `${ms} ms`;
};

/** Prints out status logs for reoccurring actions.  If startTime is provided, it prints out the time that has passed since. */
export const LOG_INFO = (msg: string, startTime?: number): any => {
    const now = performance.now();
    const hasGear = msg.includes('Refreshing');
    const hasCheck = msg.includes('Updated');

    if (IS_PRODUCTION) {
        return;
    }

    const timestamp = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    if (startTime) {
        console.log(
            `[INFO]:\t ${timestamp}\t${hasCheck ? '✔ ' : ''}${msg}, took ${calcTimeDifference(now, startTime)}`
        );
    } else {
        console.log(`[INFO]:\t ${timestamp}\t${hasGear ? '⚙ ' : ''}${msg}`);
    }
    return now;
};
