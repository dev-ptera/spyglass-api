import { LOG_ERR } from '@app/services';
import { Peers, peersRpc } from '@app/rpc';
import { PeerVersionsDto } from '@app/types';

export const getPeerVersionsPromise = (): Promise<PeerVersionsDto[]> =>
    new Promise((resolve, reject) => {
        peersRpc()
            .then((peerRpcData: Peers) => {
                const versionMap = new Map<string, number>();
                for (const ip in peerRpcData.peers) {
                    const version = peerRpcData.peers[ip].protocol_version;
                    versionMap.has(version)
                        ? versionMap.set(version, versionMap.get(version) + 1)
                        : versionMap.set(version, 1);
                }
                const versionArr: PeerVersionsDto[] = [];
                for (const key of versionMap.keys()) {
                    versionArr.push({ version: key, count: versionMap.get(key) });
                }
                resolve(versionArr);
            })
            .catch(reject);
    });

/** Returns protocol versions of all connected peers. */
export const getPeerVersions = (req, res): void => {
    getPeerVersionsPromise()
        .then((data: PeerVersionsDto[]) => {
            res.send(data);
        })
        .catch((err) => {
            res.status(500).send(LOG_ERR('getPeerVersions', err));
        });
};
