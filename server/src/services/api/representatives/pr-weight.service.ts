import { NANO_CLIENT } from '@app/config';
import { ConfirmationQuorumResponse } from '@dev-ptera/nano-node-rpc';
import { convertFromRaw, LOG_ERR } from '@app/services';
import { PRWeightRequirementDto } from '@app/types';

/** Returns weight required to be considered a principal representative. */
export const getPRWeightPromise = (): Promise<number> =>
    NANO_CLIENT.confirmation_quorum()
        .then((quorumResponse: ConfirmationQuorumResponse) =>
            Promise.resolve(Number((0.001 * convertFromRaw(quorumResponse.online_stake_total)).toFixed(5)))
        )
        .catch((err) => Promise.reject(LOG_ERR('getPRWeightPromise', err)));

/** Returns weight required to be considered a principal representative. */
export const getPRWeightV1 = (res): void => {
    getPRWeightPromise()
        .then((weight) => res.send({ weight } as PRWeightRequirementDto))
        .catch((err) => res.status(500).send(err));
};
