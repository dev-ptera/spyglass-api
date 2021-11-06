import axios, { AxiosResponse } from 'axios';
import { MonitoredRepDto, PeerMonitorStats } from '@app/types';
import { peersRpc, Peers } from '@app/rpc';
import { isRepOnline, LOG_ERR, LOG_INFO, markRepAsOnline } from '@app/services';
import { AppCache, MANUAL_PEER_MONITOR_URLS } from '@app/config';
import {
    isRepPrincipal,
    populateDelegatorsCount,
    sortMonitoredRepsByName,
    sortMonitoredRepsByStatus,
} from './rep-utils';

const logMonitoredRepStatus = (rep: PeerMonitorStats, repCount: number): void => {
    console.log(
        `${repCount}\t${isRepOnline(rep.nanoNodeAccount) ? '✔' : '✗'} ${
            rep.nanoNodeAccount
        } ${rep.nanoNodeName.padStart(40, ' ')}  ${setCustomMonitorPageUrl(rep) || formatMonitorUrl(rep.ip)}`
    );
};

/** Some monitored representatives will require their representative page to not link redirectly to the statistics page.
 *  Resolve these custom reps here.
 * */
const setCustomMonitorPageUrl = (rep: PeerMonitorStats): string => {
    // TODO: This part of this service is just horribly unreadable.  Figure this out later.
    if (!rep || !rep.ip) {
        return undefined;
    }
    if (rep.ip.includes('node.nanners.cc')) {
        return '' + ''; /// ??? Wtf am I doing here?
    }
    // TODO: Creeper
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
            /* Remove non-banano representatives from the peers list. */
            if (!response.data.repAccount.includes('ban_')) {
                return Promise.resolve(undefined);
            }
            return Promise.resolve(response.data);
        })
        .catch(() => Promise.resolve(undefined));

const formatMonitorUrl = (ip: string): string => {
    if (ip && (ip.includes('http') || ip.includes('https'))) {
        return ip;
    }
    return `http://${ip}`;
};

/** Prunes & grooms data that is returned to client.
 *  Only monitors with an online representative will be returned to the client.
 *  This is because some peers may be online but with a misconfigured node. (e.g. a monitor with an incorrect address displayed.)
 * */
const groomDto = async (allPeerStats: PeerMonitorStats[]): Promise<MonitoredRepDto[]> => {
    const groomedDetails: MonitoredRepDto[] = [];
    const delegatorsCountMap = new Map<string, { delegatorsCount: number }>();

    // Prune duplicate monitors by address
    const uniqueMonitors = new Set<PeerMonitorStats>();
    const addresses = new Set<string>();
    for (const rep of allPeerStats) {
        if (rep && !addresses.has(rep.nanoNodeAccount)) {
            addresses.add(rep.nanoNodeAccount);
            uniqueMonitors.add(rep);
        }
    }

    let repCount = 0;
    let offlineCount = 0;
    const sortedByStatus = sortMonitoredRepsByStatus(Array.from(uniqueMonitors.values()));
    for (const rep of sortedByStatus) {
        // V22 changes make it so that non-PRs no longer appear in the representatives_online rpc call, since they do not rebroadcast votes.
        // If a node-monitor is discovered for these smaller representatives, mark them as online; whenever they gain enough votes to be considered a PR, expect them to appear within the representatives_online rpc call.
        // This might actually be fixed in v23
        if (!isRepPrincipal(rep.votingWeight)) {
            markRepAsOnline(rep.nanoNodeAccount, true);
        } else if (!isRepOnline(rep.nanoNodeAccount)) {
            // Only show monitors that are actually online;
            offlineCount++;
            logMonitoredRepStatus(rep, ++repCount);
            continue;
        }

        logMonitoredRepStatus(rep, ++repCount);
        delegatorsCountMap.set(rep.nanoNodeAccount, { delegatorsCount: 0 });
        groomedDetails.push({
            address: rep.nanoNodeAccount,
            representative: rep.repAccount,
            weight: rep.votingWeight,
            delegatorsCount: 0, // This is populated by an rpc command further down.
            name: rep.nanoNodeName,
            peers: Number(rep.numPeers),
            online: true,
            cementedBlocks: rep.cementedBlocks,
            confirmationInfo: rep.confirmationInfo,
            ip: rep.ip,
            customMonitorPageUrl: setCustomMonitorPageUrl(rep),
            version: rep.version,
            location: rep.nodeLocation,
            nodeUptimeStartup: rep.nodeUptimeStartup,
            confirmedBlocks: Number(rep.confirmedBlocks),
            uncheckedBlocks: Number(rep.uncheckedBlocks),
            currentBlock: Number(rep.currentBlock),
            systemLoad: rep.systemLoad,
            totalMem: rep.totalMem,
            usedMem: rep.usedMem,
        });
    }

    // Populate the delegators count to each rep.
    await populateDelegatorsCount(delegatorsCountMap).catch((err) => Promise.reject(err));
    groomedDetails.map((dto) => (dto.delegatorsCount = delegatorsCountMap.get(dto.address).delegatorsCount));
    console.log(`${repCount - offlineCount}/${repCount} monitored reps considered online.`);
    return Promise.resolve(groomedDetails);
};

/** Sample: [::ffff:178.128.46.252]:7071 */
const extractIpAddress = (dirtyIp: string): string => dirtyIp.replace('::ffff:', '').match(/(?<=\[).+?(?=\])/)[0];

/** Fetches monitored peer details, then sends groomed response. */
const getRepDetails = (rpcData: Peers): Promise<MonitoredRepDto[]> => {
    const peerMonitorStatsPromises: Array<Promise<PeerMonitorStats>> = [];
    const peerIpAddresses = new Set<string>();

    // This service includes the ability to manually hard-code peer monitor ips or host names.
    // Even if this node isn't directly connected to these monitors as a peer, we can still display their node stats.
    MANUAL_PEER_MONITOR_URLS.map((url: string) => {
        peerIpAddresses.add(url);
        peerMonitorStatsPromises.push(getPeerMonitorStats(url));
    });

    // Add all peer ips to the list of ips to fetch
    for (const dirtyIp in rpcData.peers) {
        const ip = extractIpAddress(dirtyIp);
        const rpcDetails = rpcData.peers[dirtyIp];
        if (ip && rpcDetails && !peerIpAddresses.has(ip)) {
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

// banano creeper does not have a api.php.  Let's add it to the list of monitored representatives at some point.
export const getPeers = (req, res): void => {
    peersRpc()
        .then((peers: Peers) => {
            getRepDetails(peers)
                .then((details: MonitoredRepDto[]) => {
                    res.send(JSON.stringify(details));
                })
                .catch((err) => {
                    res.status(500).send(LOG_ERR('getPeers', err));
                });
        })
        .catch((err) => {
            res.status(500).send(LOG_ERR('getPeers', err));
        });
};

/** Given a list of currently online monitored reps & Monitored Reps from the AppCache, return an aggregate list of 'online' monitored reps.
 *  Reps are marked as online until unresponsive for OFFLINE_AFTER_PINGS pings. */
const includeCachedOnlineMonitoredReps = (currentReps: MonitoredRepDto[]): MonitoredRepDto[] => {
    const allMonitoredReps = new Map<string, MonitoredRepDto>();
    AppCache.representatives.monitoredReps.map((rep) => allMonitoredReps.set(rep.address, rep));
    currentReps.map((rep) => allMonitoredReps.set(rep.address, rep));
    const onlineMonitoredReps: MonitoredRepDto[] = [];
    for (const address of allMonitoredReps.keys()) {
        if (isRepOnline(address)) {
            onlineMonitoredReps.push(allMonitoredReps.get(address));
        }
    }
    return onlineMonitoredReps;
};

/** Given a list of MonitoredRepDto, sorts by name. */

/** Using a combination of hard-coded ips & the peers RPC command, returns a list of representatives running the Nano Node Monitor software. */
export const getMonitoredReps = async (): Promise<MonitoredRepDto[]> => {
    const start = LOG_INFO('Refreshing Monitored Reps');
    return new Promise((resolve, reject) => {
        peersRpc()
            .then((peers: Peers) => {
                getRepDetails(peers)
                    .then((repDetails: MonitoredRepDto[]) => {
                        const monitoredReps = sortMonitoredRepsByName(includeCachedOnlineMonitoredReps(repDetails));
                        LOG_INFO('Monitored Reps Updated', start);
                        resolve(monitoredReps);
                    })
                    .catch((err) => reject(LOG_ERR('getMonitoredReps', err)));
            })
            .catch((err) => reject(LOG_ERR('getMonitoredReps', err)));
    });
};
