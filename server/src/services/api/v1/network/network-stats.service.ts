import { AppCache } from '@app/config';
import { getPeerVersionsPromise, LOG_ERR, LOG_INFO } from '@app/services';
import { BasicRepDetails, PeerVersionsDto, QuorumDto, SupplyDto } from '@app/types';
import { getAllReps } from './representatives.service';
import { getSupplyPromise } from './supply.service';
import { getQuorumPromise } from './quorum.service';
import { calcConsensusStats, calcNakamotoCoefficient } from './network-calculations';
import { rawToBan } from 'banano-unit-converter';

export const convertToBan = (raw: string): number => Math.round(Number(rawToBan(raw)));

/** This is called to update the Network Stats in the AppCache. */
export const cacheNetworkStats = async (): Promise<void> => {
    const start = LOG_INFO('Refreshing Network Stats');
    return new Promise((resolve) => {
        Promise.all([getAllReps(), getSupplyPromise(), getQuorumPromise(), getPeerVersionsPromise()])
            .then((response: [BasicRepDetails[], SupplyDto, QuorumDto, PeerVersionsDto[]]) => {
                const reps = response[0];
                const supply = response[1];
                const quorum = response[2];
                const peerVersions = response[3];
                const consensus = calcConsensusStats(reps, supply.totalAmount, quorum);
                const nakamotoCoefficient = calcNakamotoCoefficient(reps, quorum);
                AppCache.networkStats = {
                    supply: supply,
                    consensus,
                    quorum,
                    nakamotoCoefficient,
                    peerVersions,
                    principalRepMinBan: Math.round(quorum.onlineStakeTotal * 0.001),
                    openedAccounts: AppCache.networkStats.openedAccounts,
                };
                resolve(LOG_INFO('Network Stats Updated', start));
            })
            .catch((err) => {
                resolve(LOG_ERR('cacheNetworkStats', err));
            });
    });
};
