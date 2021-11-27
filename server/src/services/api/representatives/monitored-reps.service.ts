import axios, { AxiosResponse } from 'axios';
import { Peers, peersRpc } from '@app/rpc';
import { AppCache, MANUAL_PEER_MONITOR_URLS } from '@app/config';
import { EulenMonitoredRepresentativeDto, MonitoredRepresentativeDto } from '@app/types';
import { LOG_INFO, LOG_ERR, getPRWeightPromise } from '@app/services';
import { sortMonitoredRepsByName } from './rep-utils';

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
const getPeerMonitorStats = (url: string): Promise<NanoNodeMonitorStats> =>
    axios
        .request<NanoNodeMonitorStats>({
            method: 'get',
            timeout: 15000,
            url: getMonitoredUrl(url),
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
        .catch(() => Promise.resolve(undefined));

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
        groomedDetails.push({
            address: rep.nanoNodeAccount,
            representative: rep.repAccount,
            weight: rep.votingWeight,
            name: rep.nanoNodeName,
            peers: Number(rep.numPeers),
            online: true,
            cementedBlocks: rep.cementedBlocks,
            confirmationInfo: rep.confirmationInfo,
            ip: rep.ip,
            version: rep.version,
            location: rep.nodeLocation,
            nodeUptimeStartup: rep.nodeUptimeStartup,
            uncheckedBlocks: Number(rep.uncheckedBlocks),
            currentBlock: Number(rep.currentBlock),
            systemLoad: rep.systemLoad,
            totalMem: rep.totalMem,
            usedMem: rep.usedMem,
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
    MANUAL_PEER_MONITOR_URLS.map((url: string) => {
        peerIpAddresses.add(url);
        peerMonitorStatsPromises.push(getPeerMonitorStats(url));
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

/** Using a combination of hard-coded ips & the peers RPC command, returns a list of representatives running the Nano Node Monitor software. */
export const cacheMonitoredReps = async (): Promise<void> => {
    const start = LOG_INFO('Refreshing Monitored Reps');
    const monitoredReps = await getMonitoredRepsPromise();

    // Required in v22; may be removed in the future.
    await markNonPRsOnline(monitoredReps);

    AppCache.monitoredReps = monitoredReps;
    LOG_INFO('Monitored Reps Updated', start);
};
