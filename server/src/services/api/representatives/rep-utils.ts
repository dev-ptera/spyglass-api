import { AppCache, NANO_CLIENT } from '@app/config';
import * as RPC from '@dev-ptera/nano-node-rpc';
import { DelegatorsOverviewDto, MonitoredRepresentativeDto } from '@app/types';
import { getDelegatorsPromise, getRepresentativesPromise, LOG_ERR, LOG_INFO, minutesToMs } from '@app/services';

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

/** Given a list of representatives, updates the delegator count cache if `ignoreCache` is not specified.  */
export const populateDelegatorsCount =
    async (reps: string[], overwriteCache?: boolean): Promise<void> => {

        const delegatorCountPromises: Promise<void>[] = [];

        for (const address of reps) {
            if (!AppCache.delegatorCount.has(address) || overwriteCache) {
                delegatorCountPromises.push(
                    getDelegatorsPromise({ address, size: 0 }).then((data: DelegatorsOverviewDto) => {
                        AppCache.delegatorCount
                            .set(address, { total: data.count, funded: data.count - data.emptyCount });
                    })
                );
            }
        }

        try {
            await Promise.all(delegatorCountPromises);
        } catch (err) {
            LOG_ERR('populateDelegatorsCount', err);
        }
};
