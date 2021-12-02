import { KNOWN_VANITIES } from '@app/config';

/** Small service that returns a hard-coded list of accounts that are known to have custom avatars. */
export const getKnownVanities = (res): void => {
    res.send(KNOWN_VANITIES);
};
