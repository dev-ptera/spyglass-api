import { ConsensusStatsDto } from './ConsensusStatsDto';
import { SupplyDto } from './SupplyDto';
import { QuorumDto } from './QuorumDto';
import { PeerVersionsDto } from './PeerVersionsDto';

export type NetworkStatsDto = {
    consensus: ConsensusStatsDto;
    supply: SupplyDto;
    quorum: QuorumDto;
    nakamotoCoefficient: number;
    peerVersions: PeerVersionsDto[];
    principalRepMinBan: number;
    /** This value is populated whenever the account distribution metrics are updated. */
    openedAccounts: number;
};
