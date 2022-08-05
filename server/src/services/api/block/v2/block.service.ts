import { blocksInfoPromiseV2 } from '@app/services';

/** Returns block information for a given hash.  */
export const getBlockInfoV2 = async (req, res): Promise<void> => {
    const parts = req.url.split('/');
    const hash = parts[parts.length - 1];
    try {
        const blocks = await blocksInfoPromiseV2([hash]);
        res.send(blocks);
    } catch (err) {
        res.status(500).send(err);
    }
};
