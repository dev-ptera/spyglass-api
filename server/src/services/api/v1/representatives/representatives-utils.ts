import { MonitoredRepDto, PeerMonitorStats, RepresentativeDto } from '@app/types';
import { isRepOnline, LOG_ERR } from '@app/services';
import { AppCache, NANO_CLIENT } from '@app/config';
import * as RPC from '@dev-ptera/nano-node-rpc';

/** This file contains just random helpers to help clean up the logic from various rep-based services. */

export const sortRepByWeight = (reps: RepresentativeDto[]): RepresentativeDto[] =>
    reps.sort(function (a, b) {
        const weightA = a.weight;
        const weightB = b.weight;
        return weightA < weightB ? 1 : weightA > weightB ? -1 : 0;
    });

export const sortMonitoredRepsByName = (onlineReps: MonitoredRepDto[]): MonitoredRepDto[] =>
    onlineReps.sort(function (a, b) {
        const textA = a.name.toUpperCase();
        const textB = b.name.toUpperCase();
        return textA < textB ? -1 : textA > textB ? 1 : 0;
    });

export const sortMonitoredRepsByStatus = (onlineReps: PeerMonitorStats[]): PeerMonitorStats[] =>
    onlineReps.sort((a, b) => {
        if (isRepOnline(a.nanoNodeAccount) && !isRepOnline(b.nanoNodeAccount)) {
            return -1;
        }
        if (isRepOnline(b.nanoNodeAccount) && !isRepOnline(a.nanoNodeAccount)) {
            return 1;
        }
        return 0;
    });

/** Given a weight (non-raw), returns if it's enough to be a considered a Principal Representative. */
export const isRepPrincipal = (weight: number): boolean => weight > AppCache.networkStats.principalRepMinBan;

/** Given a map of representatives, populates delegators count. */
export const populateDelegatorsCount = async (
    reps: Map<string, Partial<{ delegatorsCount: number }>>
): Promise<void> => {
    const delegatorCountPromises: Promise<{ address: string; delegatorsCount: number }>[] = [];

    for (const address of reps.keys()) {
        delegatorCountPromises.push(
            NANO_CLIENT.delegators_count(address)
                .then((data: RPC.DelegatorsCountResponse) =>
                    Promise.resolve({
                        address,
                        delegatorsCount: Number(data.count),
                    })
                )
                .catch((err) => {
                    LOG_ERR('cacheRepresentatives.delegators_count', err, { address });
                    return Promise.resolve({
                        address,
                        delegatorsCount: 0,
                    });
                })
        );
    }
    await Promise.all(delegatorCountPromises).then((data) => {
        data.map((pair) => (reps.get(pair.address).delegatorsCount = Number(pair.delegatorsCount)));
    });
};
