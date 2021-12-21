const moduleAlias = require('module-alias');
moduleAlias.addAlias('@app/config', __dirname + '/config');
moduleAlias.addAlias('@app/middleware', __dirname + '/middleware');
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
    WALLETS_REFRESH_INTERVAL_MS,
} from '@app/config';
import {
    getNakamotoCoefficient,
    getRepresentatives,
    getAliasedRepresentatives,
    sleep,
    getBlockInfo,
    getRepresentativesUptime,
    cacheMonitoredReps,
    writeNewRepresentativeUptimePings,
    cacheKnownAccounts,
    getKnownVanities,
    getKnownAccounts,
    getSupply,
    getDeveloperFunds,
    getPRWeight,
    getAccountInsights,
    getDelegators,
    getConfirmedTransactions,
    importHistoricHashTimestamps,
    cacheOnlineRepresentatives,
    getAccountRepresentative,
    cacheAccountDistribution,
    parseRichListFromFile,
    getDistributionBuckets,
    getRichList,
    getPeerVersions,
    getQuorum,
    convertManualKnownAccountsToJson,
    getBurn,
    getRichListSnapshot,
    getRichListSnapshotPost,
    getReceivableTransactions,
    getAccountExport,
    getAccountOverview,
    getLedgerSize,
    getScores,
} from '@app/services';
import { corsOptions, memCache, rateLimter } from '@app/middleware';

const sendCached = (res, cacheKey: keyof AppCache): void => res.send(JSON.stringify(AppCache[cacheKey]));

/* Set response headers to text-json */
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
});

app.use(cors(corsOptions));
app.use(rateLimter);
app.use(memCache);

/* Account */
//app.post(`/${PATH_ROOT}/account/:address/delegators`, (req, res) => getDelegators(req, res));
app.get(`/${PATH_ROOT}/account/representative/:address`, (req, res) => getAccountRepresentative(req, res));
app.get(`/${PATH_ROOT}/account/overview/:address`, (req, res) => getAccountOverview(req, res));
app.post(`/${PATH_ROOT}/account/confirmed-transactions`, (req, res) => getConfirmedTransactions(req, res));
app.post(`/${PATH_ROOT}/account/receivable-transactions`, (req, res) => getReceivableTransactions(req, res));
app.post(`/${PATH_ROOT}/account/delegators`, (req, res) => getDelegators(req, res));
app.post(`/${PATH_ROOT}/account/insights`, (req, res) => getAccountInsights(req, res));
app.post(`/${PATH_ROOT}/account/export`, (req, res) => getAccountExport(req, res));

/* Block */
app.get(`/${PATH_ROOT}/block/:block`, (req, res) => getBlockInfo(req, res));

/* Distribution */
app.get(`/${PATH_ROOT}/distribution/burn`, (req, res) => getBurn(res));
app.get(`/${PATH_ROOT}/distribution/supply`, (req, res) => getSupply(res));
app.get(`/${PATH_ROOT}/distribution/buckets`, (req, res) => getDistributionBuckets(res));
app.get(`/${PATH_ROOT}/distribution/developer-funds`, (req, res) => getDeveloperFunds(res));
app.get(`/${PATH_ROOT}/distribution/rich-list-snapshot`, (req, res) => getRichListSnapshot(res));
app.post(`/${PATH_ROOT}/distribution/rich-list-snapshot`, (req, res) => getRichListSnapshotPost(req, res));
app.post(`/${PATH_ROOT}/distribution/rich-list`, (req, res) => getRichList(req, res));

/* Known */
app.get(`/${PATH_ROOT}/known/vanities`, (req, res) => getKnownVanities(res));
app.post(`/${PATH_ROOT}/known/accounts`, (req, res) => getKnownAccounts(req, res));

/* Network */
app.get(`/${PATH_ROOT}/network/ledger-size`, (req, res) => getLedgerSize(res));
app.get(`/${PATH_ROOT}/network/quorum`, (req, res) => getQuorum(res));
app.get(`/${PATH_ROOT}/network/peers`, (req, res) => getPeerVersions(res));
app.get(`/${PATH_ROOT}/network/nakamoto-coefficient`, (req, res) => getNakamotoCoefficient(res));

/* Representatives */
app.get(`/${PATH_ROOT}/representatives/pr-weight`, (req, res) => getPRWeight(res));
app.get(`/${PATH_ROOT}/representatives/aliases`, (req, res) => getAliasedRepresentatives(res));
app.get(`/${PATH_ROOT}/representatives/monitored`, (req, res) => sendCached(res, 'monitoredReps'));
app.get(`/${PATH_ROOT}/representatives/online`, (req, res) => sendCached(res, 'onlineRepresentatives'));
app.get(`/${PATH_ROOT}/representatives/scores`, (req, res) => getScores(res));
app.post(`/${PATH_ROOT}/representatives`, (req, res) => getRepresentatives(req, res));
app.post(`/${PATH_ROOT}/representatives/uptime`, (req, res) => getRepresentativesUptime(req, res));

const port: number = Number(process.env.PORT || 3000);
const server = http.createServer(app);

export const setRefreshIncrements = async (cacheFns: Array<{ method: Function; interval: number }>) => {
    for (const fn of cacheFns) {
        fn.method();
        setInterval(() => fn.method(), fn.interval);
    }
};

server.listen(port, () => {
    console.log(`Running Spyglass API on port ${port}.`);
    console.log(`Production mode enabled? : ${IS_PRODUCTION}`);
    void parseRichListFromFile();
    void importHistoricHashTimestamps();
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

    /* Updating the network metrics are now staggered so that during each reset interval, not all calls are fired at once.
     *  This will put a little less strain on the node running the API.  */
    void setRefreshIncrements([
        onlineRepresentatives,
        monitoredRepresentatives,
        // This has to be called after the monitoredRepresentatives & onlineRepresentatives calls.
        // In V22, small reps are not online via rpc so use monitor software to mark as online.
        writeUptimePings,
        knownAccounts,
        accountsDistribution,
    ]);
});
