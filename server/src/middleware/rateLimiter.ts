import { API_ACCESS_TOKENS } from './api-access-tokens';
export const REQUESTS_PER_MINUTE = 50;

const rateLimit = require('express-rate-limit');

export const rateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: async (request) => {
        if (API_ACCESS_TOKENS.includes(request.get('Authorization'))) {
            return 1000;
        } else return REQUESTS_PER_MINUTE;
    },
    message: { error: 'Too many requests, please try again later.' },
});
