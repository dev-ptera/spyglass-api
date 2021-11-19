import { rawToBan } from 'banano-unit-converter';

/** Wait interval in milliseconds. */
export const sleep = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

/** Given RAW, converts to ban or nano. */
export const convertFromRaw = (raw: string): number => {
    if (raw === '0') {
        return 0;
    }
    return Math.round(Number(rawToBan(raw)));
};
