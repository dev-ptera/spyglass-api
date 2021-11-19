import { NANO_CLIENT } from '@app/config';
import { ConfirmationQuorumResponse } from '@dev-ptera/nano-node-rpc';
import { convertFromRaw, LOG_ERR, LOG_INFO } from '@app/services';
import { PRWeightRequirementDto } from '@app/types';

export const getPRWeightPromise = (): Promise<number> =>
    NANO_CLIENT.confirmation_quorum()
        .then((quorumResponse: ConfirmationQuorumResponse) =>
            Promise.resolve(Number((0.001 * convertFromRaw(quorumResponse.online_stake_total)).toFixed(5)))
        )
        .catch((err) => Promise.reject(LOG_ERR('getPrincipalRequirementPromise', err)));

/** Returns weight required to be considered a principal representative. */
export const getPRWeight = async (req, res): Promise<PRWeightRequirementDto> => {
    const start = LOG_INFO('Updating Principal Rep Weight Requirement');
    const weight = await getPRWeightPromise();
    const response = { weight };
    res.send(response);
    LOG_INFO('Principal Rep Weight Requirement Updated', start);
    return response;
};
