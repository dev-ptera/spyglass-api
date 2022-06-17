import { readFileContents } from '@app/services';
import {PROFILE, URL_WHITE_LIST} from '@app/config';

export const REQUESTS_PER_MINUTE = 50;

const rateLimit = require('express-rate-limit');
const API_ACCESS_TOKENS = readFileContents(`database/${PROFILE}/api-access-tokens.json`);

export const rateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: async (request) => {
        const origin = request.headers.origin;
        if (origin && URL_WHITE_LIST.includes(origin)) {
            return 1000;
        }
        if (API_ACCESS_TOKENS.includes(request.get('Authorization'))) {
            console.log(request.get('Authorization'));
            return 1000;
        } else return REQUESTS_PER_MINUTE;
    },
    message: { error: 'Too many requests, please try again later.' },
});
