import {REQUESTS_PER_MINUTE} from "@app/config";
import {minutesToMs} from "@app/services";
const rateLimit = require('express-rate-limit');

export const rateLimter = rateLimit({
    windowMs: minutesToMs(1),
    max: REQUESTS_PER_MINUTE, // limit each IP to 20 requests per windowMs
});
