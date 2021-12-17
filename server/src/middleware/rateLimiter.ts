import {REQUESTS_PER_MINUTE} from '@app/config';

const rateLimit = require('express-rate-limit');

export const rateLimter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: REQUESTS_PER_MINUTE, // limit each IP to 20 requests per windowMs
});

