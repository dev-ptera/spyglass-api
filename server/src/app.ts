const moduleAlias = require('module-alias');
moduleAlias.addAlias('@app/config', __dirname + '/config');
moduleAlias.addAlias('@app/rpc', __dirname + '/rpc');
moduleAlias.addAlias('@app/services', __dirname + '/services');
moduleAlias.addAlias('@app/types', __dirname + '/types');

import * as express from 'express';
import * as cors from 'cors';

const dotenv = require('dotenv');
dotenv.config();
const http = require('http');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
process.env.UV_THREADPOOL_SIZE = String(16);

app.use(morgan('dev'));

app.use(bodyParser.json()); //utilizes the body-parser package

import { IS_PRODUCTION, PATH_ROOT, URL_WHITE_LIST } from '@app/config';
import {
    getLargeReps,
    getMonitoredReps,
    getOnlineReps,
    getRepresentatives,
    getAliasedRepresentatives,
    getKnownAccounts,
    getAccountAliases,
    LOG_INFO,
    sleep,
    getRepresentativesUptime,
} from '@app/services';

const corsOptions = {
    origin: function (origin, callback) {
        if (IS_PRODUCTION && origin && URL_WHITE_LIST.indexOf(origin) === -1) {
            callback(new Error(`Origin '${origin}' is not allowed by CORS`));
        } else {
            callback(null, true);
        }
    },
};

app.use(cors(corsOptions));

/* Real time results */
app.post(`/${PATH_ROOT}/v1/representatives`, (req, res) => getRepresentatives(req, res));
app.post(`/${PATH_ROOT}/v1/representatives/large`, (req, res) => getLargeReps(req, res));
app.get(`/${PATH_ROOT}/v1/representatives/online`, (req, res) => getOnlineReps(req, res));
app.get(`/${PATH_ROOT}/v1/representatives/monitored`, (req, res) => getMonitoredReps(req, res));
app.get(`/${PATH_ROOT}/v1/representatives/aliases`, (req, res) => getAliasedRepresentatives(req, res));
app.post(`/${PATH_ROOT}/v1/representatives/uptime`, (req, res) => getRepresentativesUptime(req, res));

app.get(`/${PATH_ROOT}/v1/accounts/known`, (req, res) => getKnownAccounts(req, res));
app.get(`/${PATH_ROOT}/v1/accounts/aliases`, (req, res) => getAccountAliases(req, res));

app.get(`/${PATH_ROOT}/online-reps`, (req, res) => getOnlineReps(req, res));

const port: number = Number(process.env.PORT || 3000);
const server = http.createServer(app);

export const staggerServerUpdates = async (cacheFns: Array<{ method: Function; interval: number }>) => {
    for (const fn of cacheFns) {
        await fn.method();
        setInterval(() => fn.method(), fn.interval);
        await sleep(2000);
    }
};

server.listen(port, () => {
    LOG_INFO(`Running yellow-spyglass server on port ${port}.`);
    LOG_INFO(`Production mode enabled? : ${IS_PRODUCTION}`);
    // importHistoricHashTimestamps(); // TODO: Prune timestamps after March 18, 2021
});
