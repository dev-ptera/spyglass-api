import { BasicRepDetails, ConsensusStatsDto, QuorumDto } from '@app/types';

export const calcConsensusStats = (
    reps: BasicRepDetails[],
    totalSupply: number,
    quorum: QuorumDto
): ConsensusStatsDto => {
    const onlineAmount = quorum.onlineStakeTotal;
    let offlineAmount = 0;
    for (const rep of reps) {
        if (!rep.online) {
            offlineAmount += rep.votingWeight;
        }
    }
    const noRepAmount = totalSupply - onlineAmount - offlineAmount;

    return {
        onlineAmount,
        onlinePercent: onlineAmount / totalSupply,
        offlineAmount,
        offlinePercent: offlineAmount / totalSupply,
        noRepAmount,
        noRepPercent: noRepAmount / totalSupply,
    };
};

export const calcNakamotoCoefficient = (reps: BasicRepDetails[], quorum: QuorumDto): number => {
    const weights = [];
    reps.map((rep) => weights.push(rep.votingWeight));
    weights.sort((a, b) => (a > b ? -1 : b > a ? 1 : 0));

    let total = 0;
    let coefficient = 1;
    const MAX_BREAKPOINTS = 15;
    let i = 0;
    for (const weight of weights) {
        i++;
        total += weight;
        if (i > MAX_BREAKPOINTS) {
            break;
        }
        if (total < quorum.quorumDelta) {
            coefficient++;
        }
    }
    return coefficient;
};
