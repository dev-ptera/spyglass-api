import { LOG_ERR } from '@app/services';
import { peersRpc } from '@app/rpc';
import { PeerVersionsDto } from '@app/types';

/** Returns protocol versions of all connected peers. */
export const getPeerVersionsPromise = async (): Promise<PeerVersionsDto[]> => {
    const rpcPeerData = await peersRpc().catch((err) =>
        Promise.reject(LOG_ERR('getPeerVersionsPromise.peersRpc', err))
    );

    const versionMap = new Map<string, number>();
    const versionArr: PeerVersionsDto[] = [];

    // Iterate through each peer & count the number of the times each version appears.
    for (const ip in rpcPeerData.peers) {
        const version = rpcPeerData.peers[ip].protocol_version;
        const count = versionMap.get(version) || 0;
        versionMap.set(version, count + 1);
    }

    // Create the response.
    for (const version of versionMap.keys()) {
        versionArr.push({
            count: versionMap.get(version),
            version,
        });
    }

    return versionArr;
};

/** Returns protocol versions of all connected peers. */
export const getPeerVersions = (req, res): void => {
    getPeerVersionsPromise()
        .then((data: PeerVersionsDto[]) => {
            res.send(data);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
