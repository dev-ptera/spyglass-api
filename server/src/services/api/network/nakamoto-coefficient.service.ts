import { QuorumDto } from '@app/types';

export type BasicRepDetails = {
    address: string;
    weight: number;
    online: boolean;
};

export const calcNakamotoCoefficient = (reps: BasicRepDetails[], quorum: QuorumDto): number => {
    const weights = [];
    reps.map((rep) => weights.push(rep.weight));
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
