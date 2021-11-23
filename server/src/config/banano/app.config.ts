import { NanoClient } from '@dev-ptera/nano-node-rpc';
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

export const NANO_CLIENT = new NanoClient({
    url: process.env.RPC_URL,
    requestHeaders: {
        Authorization: process.env.RPC_AUTH || '',
    },
});
export const MANUAL_PEER_MONITOR_URLS = BAN_NODE_MONITORS;
export const LEDGER_LOCATION = '/representatives/batman/BananoData/data.ldb';
export const HOST_NODE_NAME = 'batman';
export const BACKUP_NODES = [
    'http://159.69.198.59:7070',
    'https://api-beta.banano.cc/'
    //   'https://banano-api.mynano.ninja/rpc',
    //   'https://api-beta.banano.cc/'
];
export const KNOWN_VANITIES = BAN_KNOWN_VANITIES;
export const KNOWN_ACCOUNTS = BAN_KNOWN_ACCOUNTS;
export const BURN_ADDRESSES = [
    'ban_1burnbabyburndiscoinferno111111111111111111111111111aj49sw3w',
    'ban_1ban116su1fur16uo1cano16su1fur16161616161616161616166a1sf7xw',
];
export const DEVELOPER_FUNDS = [
    'ban_3fundbxxzrzfy3k9jbnnq8d44uhu5sug9rkh135bzqncyy9dw91dcrjg67wf',
    'ban_1fundm3d7zritekc8bdt4oto5ut8begz6jnnt7n3tdxzjq3t46aiuse1h7gj',
];
