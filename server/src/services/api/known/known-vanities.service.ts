import { KNOWN_VANITIES } from '@app/config';

export const getKnownVanities = async (req, res): Promise<void> => {
    res.send(KNOWN_VANITIES);
};
