import { rawToBan } from 'banano-unit-converter';
import { useBananoConfig } from '@app/config';

/** Wait interval in milliseconds. */
export const sleep = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

/** Given RAW, converts to ban or nano. */
export const convertFromRaw = (raw: string, precision = 0): number => {
    if (raw === '0') {
        return 0;
    }
    return Number(Number(rawToBan(raw)).toFixed(precision));
};

export const isValidAddress = (address: string): boolean =>
    address && address.length === 64 && (useBananoConfig() ? address.startsWith('ban_') : address.startsWith('nano_'));
