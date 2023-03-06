import axios, { AxiosResponse } from 'axios';
import { Peers, peersRpc } from '@app/rpc';
import { AppCache, MANUAL_PEER_MONITOR_URLS } from '@app/config';
import { EulenMonitoredRepresentativeDto, KnownAccountDto, MonitoredRepresentativeDto } from '@app/types';
import { getPRWeightPromise, LOG_ERR, LOG_INFO } from '@app/services';
import { sortMonitoredRepsByName } from './rep-utils';
import * as https from 'https';

type NanoNodeMonitorStats = {
    nanoNodeAccount: string;
    nanoNodeName: string;
    version: string;
    currentBlock: number;
    uncheckedBlocks: number;
    cementedBlocks: number;
    confirmedBlocks: number;
    votingWeight: number;
    numPeers: number;
    nodeMonitorVersion: string;
    systemUptime: string;
    usedMem: number;
    totalMem: number;
    confirmationInfo: {
        average: number;
    };
    repAccount: string;
    systemLoad: number;
    nodeUptimeStartup: number;
    nodeLocation: string;
    ip: string;
};

/** Given either an IP or HTTP address of a node monitor, returns the address used to lookup node stats. */
export const getMonitoredUrl = (url: string): string => {
    if (url.includes('https') || url.includes('http')) {
        return url;
    }
    return `http://${url}/api.php`;
};

/** Given a peer IP or HTTP address, queries node monitor stats. */
const getPeerMonitorStats = (url: string): Promise<NanoNodeMonitorStats> => {
    const httpsAgent = new https.Agent({
        rejectUnauthorized: false, // Allow reps whose certifications have expired.
    });

    return axios
        .request<NanoNodeMonitorStats>({
            method: 'get',
            timeout: 15000,
            url: getMonitoredUrl(url),
            httpsAgent,
        })
        .then((response: AxiosResponse<NanoNodeMonitorStats | EulenMonitoredRepresentativeDto>) => {
            // Convert alternative monitor schemas to match the default NanoNodeMonitor response type.
            if ((response.data as EulenMonitoredRepresentativeDto).node_account) {
                const eulenNm = response.data as EulenMonitoredRepresentativeDto;
                const translatedStats = {} as NanoNodeMonitorStats;
                translatedStats.nanoNodeAccount = eulenNm.node_account;
                translatedStats.nanoNodeName = eulenNm.node_name;
                translatedStats.numPeers = eulenNm.num_peers;
                translatedStats.currentBlock = eulenNm.current_block;
                translatedStats.uncheckedBlocks = eulenNm.unchecked_blocks;
                translatedStats.cementedBlocks = eulenNm.cemented_blocks;
                translatedStats.systemLoad = eulenNm.system_load;
                translatedStats.totalMem = eulenNm.total_mem;
                translatedStats.usedMem = eulenNm.used_mem;
                translatedStats.nodeUptimeStartup = eulenNm.node_uptime;
                translatedStats.repAccount = eulenNm.rep_account;
                translatedStats.votingWeight = eulenNm.voting_weight;
                translatedStats.nodeLocation = eulenNm.node_location;
                translatedStats.version = eulenNm.version;
                response.data = translatedStats;
            }
            const nanoNodeMonitorStats = response.data as NanoNodeMonitorStats;
            nanoNodeMonitorStats.ip = url;
            if (!nanoNodeMonitorStats.nanoNodeAccount.includes('ban_')) {
                return Promise.resolve(undefined);
            }
            return Promise.resolve(nanoNodeMonitorStats);
        })
        .catch((err) => {
            /*
            if (url.includes('http:')) {
                console.error(err);
                console.log(url);
            } */
            Promise.resolve(undefined);
        });
};

/** Prunes & grooms data that is returned to client.
 *  Only monitors with an online-reps.3 representative will be returned to the client.
 *  This is because some peers may be online-reps.3 but with a misconfigured node. (e.g. a monitor with an incorrect address displayed.)
 * */
const groomDto = async (allPeerStats: NanoNodeMonitorStats[]): Promise<MonitoredRepresentativeDto[]> => {
    const groomedDetails: MonitoredRepresentativeDto[] = [];

    // Prune duplicate monitors by address
    const uniqueMonitors = new Set<NanoNodeMonitorStats>();
    const addresses = new Set<string>();

    for (const rep of allPeerStats) {
        if (rep && !addresses.has(rep.nanoNodeAccount)) {
            addresses.add(rep.nanoNodeAccount);
            uniqueMonitors.add(rep);
        }
    }

    for (const rep of Array.from(uniqueMonitors.values())) {
        let delegatorsCount;
        let fundedDelegatorsCount;
        if (AppCache.delegatorCount.has(rep.nanoNodeAccount)) {
            delegatorsCount = AppCache.delegatorCount.get(rep.nanoNodeAccount).total;
            fundedDelegatorsCount = AppCache.delegatorCount.get(rep.nanoNodeAccount).funded;
        }
        groomedDetails.push({
            address: rep.nanoNodeAccount,
            cementedBlocks: rep.cementedBlocks,
            confirmationInfo: rep.confirmationInfo,
            currentBlock: Number(rep.currentBlock),
            delegatorsCount,
            fundedDelegatorsCount: fundedDelegatorsCount,
            ip: rep.ip,
            location: rep.nodeLocation,
            name: rep.nanoNodeName,
            nodeUptimeStartup: rep.nodeUptimeStartup,
            online: true,
            peers: Number(rep.numPeers),
            representative: rep.repAccount,
            systemLoad: rep.systemLoad,
            totalMem: rep.totalMem,
            uncheckedBlocks: Number(rep.uncheckedBlocks),
            usedMem: rep.usedMem,
            version: rep.version,
            weight: rep.votingWeight,
        });
    }

    return Promise.resolve(groomedDetails);
};

/** This is required as a part of v22; smaller representatives no longer appear as online,
 * so I use their node-monitors as an indicator of whether they are online or not. */
const markNonPRsOnline = async (reps: MonitoredRepresentativeDto[]): Promise<void> => {
    const prWeight = await getPRWeightPromise();
    for (const rep of reps) {
        if (rep.weight < prWeight) {
            AppCache.offlinePingsMap.set(rep.address, 0);
        }
    }
};

/** Sample: [::ffff:178.128.46.252]:7071 */
const extractIpAddress = (dirtyIp: string): string => dirtyIp.replace('::ffff:', '').match(/(?<=\[).+?(?=\])/)[0];

/** Fetches monitored peer details and returns MonitoredRepresentativeDto[]. */
const getRepDetails = (rpcData: Peers): Promise<MonitoredRepresentativeDto[]> => {
    const peerMonitorStatsPromises: Array<Promise<NanoNodeMonitorStats>> = [];
    const peerIpAddresses = new Set<string>();

    // This service includes the ability to manually hard-code peer monitor ips or host names.
    // Even if this node isn't directly connected to these monitors as a peer, we can still display their node stats.
    MANUAL_PEER_MONITOR_URLS.map((rep: { name: string; url: string }) => {
        peerIpAddresses.add(rep.url);
        // Manual entries are inserted first so that they can get processed later first & take precedence
        // i.e Manual entries are known before a duplicate peered node.
        peerMonitorStatsPromises.push(getPeerMonitorStats(rep.url));
    });

    // Add all peer ips to the list of ips to fetch.
    for (const dirtyIp in rpcData.peers) {
        const ip = extractIpAddress(dirtyIp);
        if (!peerIpAddresses.has(ip)) {
            peerIpAddresses.add(ip);
            peerMonitorStatsPromises.push(getPeerMonitorStats(ip));
        }
    }
    return Promise.all(peerMonitorStatsPromises)
        .then((data) =>
            groomDto(data)
                .then((groomed) => Promise.resolve(groomed))
                .catch((err) => Promise.reject(LOG_ERR('getMonitoredReps.groomDto', err)))
        )
        .catch((err) => Promise.reject(LOG_ERR('getMonitoredReps.getRepDetails', err)));
};

const getMonitoredRepsPromise = async (): Promise<MonitoredRepresentativeDto[]> => {
    return new Promise((resolve, reject) => {
        peersRpc()
            .then((peers: Peers) => {
                getRepDetails(peers)
                    .then((repDetails: MonitoredRepresentativeDto[]) => {
                        const sorted = sortMonitoredRepsByName(repDetails);
                        resolve(sorted);
                    })
                    .catch((err) => reject(LOG_ERR('getMonitoredReps.getRepDetails', err)));
            })
            .catch((err) => reject(LOG_ERR('getMonitoredReps.peersRpc', err)));
    });
};

/** Iterates through the monitored reps, and updates any aliases so that they using the most up-to-date info. */
const updateKnownAccountAliases = (reps: MonitoredRepresentativeDto[]): void => {
    const knownAccountMap = new Map<string, KnownAccountDto>();
    AppCache.knownAccounts.map((account) => knownAccountMap.set(account.address, account));
    reps.map((rep) => {
        if (knownAccountMap.has(rep.address)) {
            if (rep.name !== knownAccountMap.get(rep.address).alias) {
                /* LOG_INFO(
                    `Mismatched alias for account ${rep.address} \nMONITORED: ${rep.name} vs KNOWN: ${
                        knownAccountMap.get(rep.address).alias
                    }`
                ); */
                knownAccountMap.get(rep.address).alias = rep.name;
            }
        } else {
            AppCache.knownAccounts.push({
                address: rep.address,
                alias: rep.name,
                type: 'representative',
                hasLore: false
            });
        }
    });
};

/** Using a combination of hard-coded ips & the peers RPC command, returns a list of representatives running the Nano Node Monitor software. */
export const cacheMonitoredReps = async (): Promise<void> => {

    try {

        const start = LOG_INFO('Refreshing Monitored Reps');
        const monitoredReps = await getMonitoredRepsPromise();
        updateKnownAccountAliases(monitoredReps);

        // Required in v22; may be removed in the future.
        await markNonPRsOnline(monitoredReps);

        AppCache.monitoredReps = monitoredReps;
        LOG_INFO('Monitored Reps Updated', start);
    } catch (err) {
        LOG_ERR('cacheMonitoredReps', err);
    }
};
