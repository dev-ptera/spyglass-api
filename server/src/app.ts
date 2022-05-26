const moduleAlias = require('module-alias');
moduleAlias.addAlias('@app/config', __dirname + '/config');
moduleAlias.addAlias('@app/middleware', __dirname + '/middleware');
moduleAlias.addAlias('@app/rpc', __dirname + '/rpc');
moduleAlias.addAlias('@app/services', __dirname + '/services');
moduleAlias.addAlias('@app/types', __dirname + '/types');

import * as express from 'express';
import * as cors from 'cors';
import 'express-async-errors';

const dotenv = require('dotenv');
dotenv.config();

process.env.UV_THREADPOOL_SIZE = String(16);

import {
    AppCache,
    DELEGATORS_COUNT_REFRESH_INTERVAL_MS,
    IS_PRODUCTION,
    KNOWN_ACCOUNTS_REFRESH_INTERVAL_MS,
    PATH_ROOT,
    PRICE_DATA_REFRESH_INTERVAL_MS,
    REPRESENTATIVE_SCORES_REFRESH_INTERVAL_MS,
    REPRESENTATIVES_MONITORED_REFRESH_INTERVAL_MS,
    REPRESENTATIVES_ONLINE_REFRESH_INTERVAL_MS,
    REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS,
    WALLETS_REFRESH_INTERVAL_MS,
} from '@app/config';
import {
    getNakamotoCoefficientV1,
    getRepresentativesV1,
    getAliasedRepresentativesV1,
    getBlockInfoV1,
    getBlocksInfoV1,
    getRepresentativesUptimeV1,
    cacheMonitoredReps,
    writeNewRepresentativeUptimePings,
    cacheKnownAccounts,
    getKnownVanitiesV1,
    getKnownAccountsV1,
    getSupplyV1,
    getDeveloperFundsV1,
    getPRWeightV1,
    getAccountInsightsV1,
    getNodeStatsV1,
    getDelegatorsV1,
    getConfirmedTransactionsV1,
    importHistoricHashTimestamps,
    cacheOnlineRepresentatives,
    getAccountRepresentativeV1,
    cacheAccountDistribution,
    parseRichListFromFile,
    getDistributionBucketsV1,
    getRichListV1,
    getPeerVersionsV1,
    getQuorumV1,
    convertManualKnownAccountsToJson,
    getBurnV1,
    getRichListSnapshotV1,
    getRichListSnapshotPostV1,
    getReceivableTransactionsV1,
    getAccountExportV1,
    getAccountOverviewV1,
    getLedgerSizeV1,
    getScoresV1,
    cachePriceData,
    cacheDelegatorsCount,
    sleep,
    getConfirmedTransactionsV2,
    cacheRepresentativeScores,
} from '@app/services';
import { memCache, rateLimiter, serverRestart } from '@app/middleware';

const http = require('http');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const sendCached = (res, cacheKey: keyof AppCache): void => res.send(JSON.stringify(AppCache[cacheKey]));
const app = express();

/* Middleware */
app.use(morgan('dev'));
app.use(bodyParser.json()); //utilizes the body-parser package
app.use(cors());
app.use(serverRestart);
app.use(rateLimiter);
app.use(memCache);
app.use((err, req, res, next) => {
    // Handle async errors; don't crash the server.
    console.error(`Uncaught exception: ${err}`);
    res.status(500).send({ errorMsg: 'Internal Server Error' });
});
app.use((req, res, next) => {
    // Handle worst case scenario; uncaught errors.
    res.setHeader('Content-Type', 'application/json');
    next();
});

/* Account */
app.get(`/${PATH_ROOT}/v1/account/representative/:address`, (req, res) => getAccountRepresentativeV1(req, res));
app.get(`/${PATH_ROOT}/v1/account/overview/:address`, (req, res) => getAccountOverviewV1(req, res));
app.post(`/${PATH_ROOT}/v1/account/confirmed-transactions`, (req, res) => getConfirmedTransactionsV1(req, res));
app.post(`/${PATH_ROOT}/v2/account/confirmed-transactions`, (req, res) => getConfirmedTransactionsV2(req, res));
app.post(`/${PATH_ROOT}/v1/account/receivable-transactions`, (req, res) => getReceivableTransactionsV1(req, res));
app.post(`/${PATH_ROOT}/v1/account/delegators`, (req, res) => getDelegatorsV1(req, res));
app.post(`/${PATH_ROOT}/v1/account/insights`, (req, res) => getAccountInsightsV1(req, res));
app.post(`/${PATH_ROOT}/v1/account/export`, (req, res) => getAccountExportV1(req, res));

/* Block */
app.get(`/${PATH_ROOT}/v1/block/:block`, (req, res) => getBlockInfoV1(req, res));
app.post(`/${PATH_ROOT}/v1/blocks`, (req, res) => getBlocksInfoV1(req, res));

/* Distribution */
app.get(`/${PATH_ROOT}/v1/distribution/burn`, (req, res) => getBurnV1(res));
app.get(`/${PATH_ROOT}/v1/distribution/supply`, (req, res) => getSupplyV1(res));
app.get(`/${PATH_ROOT}/v1/distribution/buckets`, (req, res) => getDistributionBucketsV1(res));
app.get(`/${PATH_ROOT}/v1/distribution/developer-funds`, (req, res) => getDeveloperFundsV1(res));
app.get(`/${PATH_ROOT}/v1/distribution/rich-list-snapshot`, (req, res) => getRichListSnapshotV1(res));
app.post(`/${PATH_ROOT}/v1/distribution/rich-list-snapshot`, (req, res) => getRichListSnapshotPostV1(req, res));
app.post(`/${PATH_ROOT}/v1/distribution/rich-list`, (req, res) => getRichListV1(req, res));

/* Known */
app.get(`/${PATH_ROOT}/v1/known/vanities`, (req, res) => getKnownVanitiesV1(res));
app.post(`/${PATH_ROOT}/v1/known/accounts`, (req, res) => getKnownAccountsV1(req, res));

/* Network */
app.get(`/${PATH_ROOT}/v1/network/ledger-size`, (req, res) => getLedgerSizeV1(res));
app.get(`/${PATH_ROOT}/v1/network/node-stats`, (req, res) => getNodeStatsV1(res));
app.get(`/${PATH_ROOT}/v1/network/quorum`, (req, res) => getQuorumV1(res));
app.get(`/${PATH_ROOT}/v1/network/peers`, (req, res) => getPeerVersionsV1(res));
app.get(`/${PATH_ROOT}/v1/network/nakamoto-coefficient`, (req, res) => getNakamotoCoefficientV1(res));

/* Representatives */
app.get(`/${PATH_ROOT}/v1/representatives/pr-weight`, (req, res) => getPRWeightV1(res));
app.get(`/${PATH_ROOT}/v1/representatives/aliases`, (req, res) => getAliasedRepresentativesV1(res));
app.get(`/${PATH_ROOT}/v1/representatives/monitored`, (req, res) => sendCached(res, 'monitoredReps'));
app.get(`/${PATH_ROOT}/v1/representatives/online`, (req, res) => sendCached(res, 'onlineRepresentatives'));
app.get(`/${PATH_ROOT}/v1/representatives/scores`, (req, res) => getScoresV1(res));
app.post(`/${PATH_ROOT}/v1/representatives`, (req, res) => getRepresentativesV1(req, res));
app.post(`/${PATH_ROOT}/v1/representatives/uptime`, (req, res) => getRepresentativesUptimeV1(req, res));

/* Price */
app.get(`/${PATH_ROOT}/v1/price`, (req, res) => sendCached(res, 'priceData'));

const port: number = Number(process.env.PORT || 3000);
const server = http.createServer(app);

export const setRefreshIncrements = async (cacheFns: Array<{ method: Function; interval: number }>) => {
    for (const fn of cacheFns) {
        try {
            await sleep(2000);
            fn.method();
        } catch (err) {}
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

    const priceData = {
        method: cachePriceData,
        interval: PRICE_DATA_REFRESH_INTERVAL_MS,
    };

    const delegatorCount = {
        method: cacheDelegatorsCount,
        interval: DELEGATORS_COUNT_REFRESH_INTERVAL_MS,
    };

    const representativeScores = {
        method: cacheRepresentativeScores,
        interval: REPRESENTATIVE_SCORES_REFRESH_INTERVAL_MS,
    };

    /* Updating the network metrics are now staggered so that during each reset interval, not all calls are fired at once.
     *  This will put a little less strain on the node running the API.  */
    void setRefreshIncrements([
        onlineRepresentatives,
        delegatorCount,
        priceData,
        monitoredRepresentatives,
        // This has to be called after the monitoredRepresentatives & onlineRepresentatives calls.
        // In V22, small reps are not online via rpc so use monitor software to mark as online.
        writeUptimePings,
        representativeScores,
        knownAccounts,
        accountsDistribution,
    ]);
});
