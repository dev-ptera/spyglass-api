import { KNOWN_VANITIES } from '@app/config';

export const getKnownVanities = (req, res): void => {
    res.send(KNOWN_VANITIES);
};
