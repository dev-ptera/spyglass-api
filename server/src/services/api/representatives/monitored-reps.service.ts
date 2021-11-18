import axios, { AxiosResponse } from 'axios';
import { Peers, peersRpc } from '@app/rpc';
import { AppCache, MANUAL_PEER_MONITOR_URLS } from '@app/config';
import { MonitoredRepresentativeDto } from '@app/types';
import { LOG_INFO, LOG_ERR } from '@app/services';
import { sortMonitoredRepsByName } from './rep-utils';

type PeerMonitorStats = {
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
    const stats = `api.php`;
    if (url.includes('https')) {
        return `${url}/${stats}`;
    }
    if (url.includes('http')) {
        return `${url}/${stats}`;
    }
    return `http://${url}/${stats}`;
};

/** Given a peer IP or HTTP address, queries node monitor stats. */
const getPeerMonitorStats = (url: string): Promise<PeerMonitorStats> =>
    axios
        .request<PeerMonitorStats>({
            method: 'get',
            timeout: 15000,
            url: getMonitoredUrl(url),
        })
        .then((response: AxiosResponse<PeerMonitorStats>) => {
            response.data.ip = url;

            // TODO: Support multiple monitor node s
            /* Remove non-banano representatives from the peers list. */
            if (!response.data.nanoNodeAccount.includes('ban_')) {
                return Promise.resolve(undefined);
            }
            return Promise.resolve(response.data);
        })
        .catch(() => Promise.resolve(undefined));

/** Prunes & grooms data that is returned to client.
 *  Only monitors with an online-reps.3 representative will be returned to the client.
 *  This is because some peers may be online-reps.3 but with a misconfigured node. (e.g. a monitor with an incorrect address displayed.)
 * */
const groomDto = async (allPeerStats: PeerMonitorStats[]): Promise<MonitoredRepresentativeDto[]> => {
    const groomedDetails: MonitoredRepresentativeDto[] = [];

    // Prune duplicate monitors by address
    const uniqueMonitors = new Set<PeerMonitorStats>();
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

/** Sample: [::ffff:178.128.46.252]:7071 */
const extractIpAddress = (dirtyIp: string): string => dirtyIp.replace('::ffff:', '').match(/(?<=\[).+?(?=\])/)[0];

/** Fetches monitored peer details and returns MonitoredRepresentativeDto[]. */
const getRepDetails = (rpcData: Peers): Promise<MonitoredRepresentativeDto[]> => {
    const peerMonitorStatsPromises: Array<Promise<PeerMonitorStats>> = [];
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
                    .catch((err) => reject(LOG_ERR('getMonitoredReps', err)));
            })
            .catch((err) => reject(LOG_ERR('getMonitoredReps', err)));
    });
};

/** Using a combination of hard-coded ips & the peers RPC command, returns a list of representatives running the Nano Node Monitor software. */
export const cacheMonitoredReps = async (): Promise<void> => {
    const start = LOG_INFO('Refreshing Monitored Reps');
    const monitoredReps = await getMonitoredRepsPromise();
    AppCache.monitoredReps = monitoredReps;
    LOG_INFO('Monitored Reps Updated', start);
};
