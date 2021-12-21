export const REQUESTS_PER_MINUTE = 20;
// TODO: issue key and reduce to 10.

const rateLimit = require('express-rate-limit');

export const rateLimter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: REQUESTS_PER_MINUTE,
});
