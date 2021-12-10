import { BAN_KNOWN_VANITIES } from './known-vanities';
import { BAN_KNOWN_ACCOUNTS } from './known-accounts';
import { BAN_NODE_MONITORS } from './node-monitors';

export const PATH_ROOT = 'banano';
export const URL_WHITE_LIST = [
    'http://localhost:4200',
    'https://localhost:4200',
    'https://spyglass-api.web.app',
    'https://www.spyglass-api.web.app',
];

export const MANUAL_PEER_MONITOR_URLS = BAN_NODE_MONITORS;
export const LEDGER_LOCATION = '/representatives/batman/BananoData/data.ldb';
export const HOST_NODE_NAME = 'batman';
export const BACKUP_NODES = ['http://159.69.198.59:7070', 'https://api-beta.banano.cc/'];
export const KNOWN_VANITIES = BAN_KNOWN_VANITIES;
export const KNOWN_ACCOUNTS = BAN_KNOWN_ACCOUNTS;
export const BURN_ADDRESSES = [
    "ban_1burnbabyburndiscoinferno111111111111111111111111111aj49sw3w", // official burn account
    "ban_1uo1cano1bot1a1pha1616161616161616161616161616161616p3s5tifp", // banano walker burn account
    "ban_1ban116su1fur16uo1cano16su1fur16161616161616161616166a1sf7xw", // volcano burn account
    "ban_1111111111111111111111111111111111111111111111111111hifc8npp" // nano burn account
];
export const DEVELOPER_FUNDS = [
    'ban_1grapemjtr5n684bu1x38th57x3te8qt6xpsyusjyi4s3u1zdoh8s1czfjz4',
    'ban_1app1es6zce5943ydasp5r5ma77cdcqt6be8qz7f88woayuqstzrjjmob4eb',
    'ban_3gojim9wh3t9w5aa8nhjbmkue8mes9frmrhy6wpqb34ikajw8h39hnbbap31',
    'ban_1acaih1rhhczkfayd3iadpjroyfbbrzm1jrkx77qfep7fnuzky7mmwzx4544',
    'ban_1ycheefobbddbde1p7874ky4ifiwebfuabkyqptunwwk84z3rgzktbqeo9fk',
    'ban_3fundbxxzrzfy3k9jbnnq8d44uhu5sug9rkh135bzqncyy9dw91dcrjg67wf',
    'ban_1fundm3d7zritekc8bdt4oto5ut8begz6jnnt7n3tdxzjq3t46aiuse1h7gj',
    'ban_3kiwizqifxokn47pp6fh5jmytoaiaeynjhx4u5r6ug13apx3345enf4mr1ep',
    'ban_3carobzdy3ah8pq1xzn38jkc46ozuu8qfx7eqzr8nyiy5yefwbaua6rkh3of',
    'ban_1pearw95xajkzq1nmo6cixo1ugijk6gpm1ifwyegz6un4mt71qb1iw3fhmj4',
    'ban_1me1onk3a11nw3kou14776fuyxtnmoatuqmpeioybffqx6okd53mo1iqmrym',
    'ban_1mangozo4tnfq97hdtu8z9rdjsqnyo33i7o9aohoxsfbpx8kgwhrfu1rggj8',
];

export const UPTIME_TRACKING_MIN_WEIGHT = 10_000;
