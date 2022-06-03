import { HostNodeStatsDto, ExplorerSummaryDto, SupplyDto } from '@app/types';
import { getSupplyPromise } from '../distribution/supply.service';
import { LOG_ERR } from '../../../log/error.service';
import { AppCache, EXPLORER_SUMMARY_STATS_PAIR } from '@app/config';
import { getNodeStatsPromise } from '../network/node-stats.service';
import { blockCountRpc } from '../../../../rpc/calls/block-count.rpc';
import { getRepresentativesPromise } from '../representatives/representatives-service';

const getSummaryPromise = async (): Promise<ExplorerSummaryDto> => {
    if (AppCache.temp.has(EXPLORER_SUMMARY_STATS_PAIR.key)) {
        return AppCache.temp.get(EXPLORER_SUMMARY_STATS_PAIR.key);
    }

    // Supply
    let supply = {} as SupplyDto;
    try {
        supply = await getSupplyPromise();
    } catch (err) {
        LOG_ERR('getSummaryPromise.getSupplyPromise', err);
    }

    // Host Data
    let serverData = {} as HostNodeStatsDto;
    try {
        serverData = await getNodeStatsPromise();
    } catch (err) {
        LOG_ERR('getSummaryPromise.getNodeStatsPromise', err);
    }

    // Block Count
    let blockCount = 0;
    try {
        const response = await blockCountRpc();
        blockCount = Number(response.count);
    } catch (err) {
        LOG_ERR('getSummaryPromise.blockCountRpc', err);
    }

    // Representatives
    let prReps = [];
    let prRepsOnline = 0;
    try {
        const prReps = await getRepresentativesPromise({ isPrincipal: true });
        prReps.map((rep) => {
            if (rep.online) {
                prRepsOnline++;
            }
        });
    } catch (err) {
        LOG_ERR('getSummaryPromise.getRepresentativesPromise', err);
    }

    const priceData = AppCache.priceData ? AppCache.priceData.bananoPriceUsd : undefined;

    const data: ExplorerSummaryDto = {
        circulatingCount: supply.circulatingAmount,
        devFundCount: supply.devFundAmount,
        knownAccountsCount: AppCache.knownAccounts.length,
        bananoPriceUsd: priceData,
        ledgerDatabaseType: serverData.storeVendor,
        ledgerSizeMB: serverData.ledgerSizeMB,
        confirmedTransactionsCount: blockCount,
        representativesOnlineCount: AppCache.onlineRepresentatives.length,
        principalRepsOnlineCount: prRepsOnline,
        totalPrincipalRepsCount: prReps.length,
    };
    AppCache.temp.put(EXPLORER_SUMMARY_STATS_PAIR.key, data, EXPLORER_SUMMARY_STATS_PAIR.duration);
    return data;
};

/** Returns network overview information */
export const getExplorerSummaryV1 = (res): void => {
    getSummaryPromise()
        .then((data) => res.send(data))
        .catch((err) => res.status(500).send(err));
};
