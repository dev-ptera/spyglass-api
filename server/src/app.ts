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

import {
    AppCache,
    IS_PRODUCTION,
    KNOWN_ACCOUNTS_REFRESH_INTERVAL_MS,
    PATH_ROOT,
    REPRESENTATIVES_MONITORED_REFRESH_INTERVAL_MS,
    REPRESENTATIVES_ONLINE_REFRESH_INTERVAL_MS,
    REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS,
    URL_WHITE_LIST,
    WALLETS_REFRESH_INTERVAL_MS,
} from '@app/config';
import {
    getRepresentatives,
    getAliasedRepresentatives,
    LOG_INFO,
    sleep,
    getRepresentativesUptime,
    cacheMonitoredReps,
    writeNewRepresentativeUptimePings,
    cacheKnownAccounts,
    getKnownVanities,
    getKnownAccounts,
    getSupply,
    getDeveloperFunds,
    getPRWeight,
    getDelegators,
    getAccountHistory,
    importHistoricHashTimestamps,
    cacheOnlineRepresentatives,
    getAccountRepresentative,
    cacheAccountDistribution,
    parseRichListFromFile,
    getDistributionBuckets,
    getRichList,
    getPeerVersions,
    getQuorum,
    convertManualKnownAccountsToJson
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

const sendCached = (res, cacheKey: keyof AppCache): void => res.send(JSON.stringify(AppCache[cacheKey]));

app.use(cors(corsOptions));

/* Account */
//app.post(`/${PATH_ROOT}/account/:address/delegators`, (req, res) => getDelegators(req, res));
app.post(`/${PATH_ROOT}/account/delegators`, (req, res) => getDelegators(req, res));
app.post(`/${PATH_ROOT}/account/history`, (req, res) => getAccountHistory(req, res));
app.get(`/${PATH_ROOT}/account/:address/representative`, (req, res) => getAccountRepresentative(req, res));

/* Representatives */
app.post(`/${PATH_ROOT}/representatives`, (req, res) => getRepresentatives(req, res));
app.get(`/${PATH_ROOT}/representatives/aliases`, (req, res) => getAliasedRepresentatives(req, res));
app.get(`/${PATH_ROOT}/representatives/monitored`, (req, res) => sendCached(res, 'monitoredReps'));
app.get(`/${PATH_ROOT}/representatives/online`, (req, res) => sendCached(res, 'onlineRepresentatives'));
app.get(`/${PATH_ROOT}/representatives/pr-weight`, (req, res) => getPRWeight(req, res));
app.post(`/${PATH_ROOT}/representatives/uptime`, (req, res) => getRepresentativesUptime(req, res));

/* Distribution */
app.get(`/${PATH_ROOT}/distribution/supply`, (req, res) => getSupply(res));
app.get(`/${PATH_ROOT}/distribution/developer-funds`, (req, res) => getDeveloperFunds(res));
app.get(`/${PATH_ROOT}/distribution/buckets`, (req, res) => getDistributionBuckets(res));
app.post(`/${PATH_ROOT}/distribution/rich-list`, (req, res) => getRichList(req, res));

/* Known */
app.get(`/${PATH_ROOT}/known/vanities`, (req, res) => getKnownVanities(req, res));
app.post(`/${PATH_ROOT}/known/accounts`, (req, res) => getKnownAccounts(req, res));

/* Network */
app.get(`/${PATH_ROOT}/network/peers`, (req, res) => getPeerVersions(req, res));
app.get(`/${PATH_ROOT}/network/quorum`, (req, res) => getQuorum(req, res));

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
    parseRichListFromFile();
    importHistoricHashTimestamps();
    convertManualKnownAccountsToJson();

    const onlineRepresentatives = {
        method: cacheOnlineRepresentatives,
        interval: REPRESENTATIVES_ONLINE_REFRESH_INTERVAL_MS,
    };

    const accountsDistribution = {
        method: IS_PRODUCTION ? cacheAccountDistribution : () => {},
        interval: WALLETS_REFRESH_INTERVAL_MS,
    };

    const monitoredRepresentatives = {
        method: cacheMonitoredReps,
        interval: REPRESENTATIVES_MONITORED_REFRESH_INTERVAL_MS,
    };

    const writeUptimePings = {
        method: writeNewRepresentativeUptimePings,
        interval: REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS,
    };

    const knownAccounts = {
        method: cacheKnownAccounts,
        interval: KNOWN_ACCOUNTS_REFRESH_INTERVAL_MS,
    };

    /* Updating the network metrics are now staggered so that each reset interval not all calls are fired at once. */
    void staggerServerUpdates([
        knownAccounts,
        onlineRepresentatives,
        monitoredRepresentatives,
        writeUptimePings,
        accountsDistribution,
    ]);
});

