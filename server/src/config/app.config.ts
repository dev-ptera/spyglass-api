import { NanoClient } from '@dev-ptera/nano-node-rpc';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/** API served from this root, example: https://api.yellowspyglass.com/banano/representatives */
export const PATH_ROOT = 'banano';

/** Domains allowed to use this API */
export const URL_WHITE_LIST = [
    'https://yellow-spyglass.web.app',
    'https://www.yellow-spyglass.web.app',
    'https://yellowspyglass.com',
    'https://www.yellowspyglass.com',
    'http://localhost:4200',
    'https://banano-whales.web.app',
    'https://www.banano-whales.web.app',
    'https://yellow-spyglass-dev.web.app',
    'https://www.yellow-spyglass-dev.web.app',
];

/** Used to read data from the BANANO node */
export const NANO_CLIENT = new NanoClient({
    url: process.env.RPC_URL,
    requestHeaders: {
        Authorization: process.env.RPC_AUTH || '',
    },
});

const calcMinutes = (mins: number) => 60000 * mins;
export const REPRESENTATIVES_REFRESH_INTERVAL_MS = calcMinutes(5);
export const WALLETS_REFRESH_INTERVAL_MS = calcMinutes(60 * 12);
export const KNOWN_ACCOUNTS_REFRESH_INTERVAL_MS = calcMinutes(60);
export const PRICE_DATA_REFRESH_INTERVAL_MS = calcMinutes(IS_PRODUCTION ? 15 : 120);
export const NETWORK_STATS_REFRESH_INTERVAL_MS = calcMinutes(5);

/** List of monitored representatives to counter-act low peer count. */
export const MANUAL_PEER_MONITOR_URLS = [
    /** DOMAIN | IP */
    '108.39.249.5', //batman
    '45.77.190.142', // Cabbit
    'banano.nifni.net',
    '192.210.243.189', // hentai
    'bagend.notellem.win',
    'node.jungletv.live', // Jungle TV
    '142.93.243.3', // Nunu
    '103.169.35.129', // Baanodeee,
    '194.163.139.46', // Banano Pixels
    '167.99.176.22', // unofficial binance rep
    '37.191.205.25', // bananOslo
    '176.10.199.150', //bananode.eu
    'banano.exchange', //banano.exchange
    '95.216.138.47', // banano italiano

    /** HTTP */
    'http://pinode.sytes.net', // NodePi

    /** HTTPS */
    'https://node.nanners.cc', // void
    'https://node.boopowo.com', // boopowo
    'https://banode.cygantech.com', // gypsy | Banode01
    'https://banano.nifni.net', // nano.nifni.net // TODO: Figure out why this node does not show up in list.
    'https://bananonode.lightcord.org', // crpay | 'bunker',
    'https://palm.just-dmitry.ru', // Dmitry
    'https://baaanodeee.com', // manhlicious,
    'https://banano.gray.network', // gray
    'https://node.eulentier.de/', // eulen
];

/** Ledger location, used to populate ledger size stats.  Must have read permission granted. */
export const LEDGER_LOCATION = '/representatives/batman/BananoData/data.ldb';

/** Name of the node running YellowSpyglass server; this is used in the Node service to gather node stats. */
export const HOST_NODE_NAME = 'batman';

/** These nodes are currently only used for the `representatives_online` rpc call to help ensure more accurate results. */
export const BACKUP_NODES = [
    /*
    'https://banano-api.mynano.ninja/rpc',
    'https://api-beta.banano.cc/'
     */
];
