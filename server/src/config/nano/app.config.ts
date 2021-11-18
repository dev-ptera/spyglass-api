import { NanoClient } from '@dev-ptera/nano-node-rpc';

export const PATH_ROOT = 'nano';
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
export const MANUAL_PEER_MONITOR_URLS = [];
export const LEDGER_LOCATION = '/representatives/batman/BananoData/data.ldb';
export const HOST_NODE_NAME = '';
export const BACKUP_NODES = [
    /*
    'https://banano-api.mynano.ninja/rpc',
    'https://api-beta.banano.cc/'
     */
];
export const KNOWN_VANITIES = [];
export const KNOWN_ACCOUNTS = [];
export const BURN_ADDRESSES = [];
export const DEVELOPER_FUNDS = [];
