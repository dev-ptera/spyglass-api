import { NANO_CLIENT } from '@app/config';
import { ConfirmationQuorumResponse } from '@dev-ptera/nano-node-rpc';
import { rawToBan } from 'banano-unit-converter';
import { LOG_ERR } from '@app/services';

export const getPrincipalRequirementPromise = (): Promise<number> =>
    NANO_CLIENT.confirmation_quorum()
        .then((quorumResponse: ConfirmationQuorumResponse) =>
            Promise.resolve(0.001 * Number(rawToBan(quorumResponse.online_stake_total)))
        )
        .catch((err) => Promise.reject(LOG_ERR('getPrincipalRequirementPromise', err)));
