import { AppCache, IS_PRODUCTION } from '@app/config';

let RESUME = false;
setTimeout(() => {
    RESUME = true;
}, 15 * 1000);

/** Defers incoming requests until server has cached enough resources to proceed.
 *  Give the server a moment to breath before being DDOS'd.
 * */
export const serverRestart = (req, res, next) => {
    if (!IS_PRODUCTION) {
        return next();
    }
    if (RESUME) {
        return next();
    }
    return res.status(503).send({ errorMsg: 'Server is restarting.' });
};
