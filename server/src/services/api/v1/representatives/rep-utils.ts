import { MonitoredRepresentativeDto } from '@app/types';

/** This file contains just random helpers to help clean up the logic from various rep-based util. */

export const sortMonitoredRepsByName = (onlineReps: MonitoredRepresentativeDto[]): MonitoredRepresentativeDto[] =>
    onlineReps.sort(function (a, b) {
        if (a.name === undefined) {
            a.name = '';
        }
        if (b.name === undefined) {
            b.name = '';
        }
        const textA = a.name.toUpperCase();
        const textB = b.name.toUpperCase();
        return textA < textB ? -1 : textA > textB ? 1 : 0;
    });
