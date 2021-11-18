import { NanoClient } from '@dev-ptera/nano-node-rpc';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/** API served from this root, example: https://api.yellowspyglass.com/banano/representatives */
export const PATH_ROOT = 'banano';

/** Domains allowed to use this API */
export const URL_WHITE_LIST = [
    'http://localhost:4200',
    'https://localhost:4200',
    'https://spyglass-api.web.app',
    'https://www.spyglass-api.web.app',
];

/** Used to read data from the BANANO node */
export const NANO_CLIENT = new NanoClient({
    url: process.env.RPC_URL,
    requestHeaders: {
        Authorization: process.env.RPC_AUTH || '',
    },
});

const calcMinutes = (mins: number) => 60000 * mins;
export const REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS = calcMinutes(1);
export const REPRESENTATIVES_MONITORED_REFRESH_INTERVAL_MS = calcMinutes(1);
export const WALLETS_REFRESH_INTERVAL_MS = calcMinutes(60 * 12);
export const KNOWN_ACCOUNTS_REFRESH_INTERVAL_MS = calcMinutes(5);
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

export const KNOWN_VANITIES = [
    'ban_19bantanopcajd8ptfg9aedn8osgrzyrbupte5j4p1je69e5diz8qtc4dopf',
    'ban_1bboss18y784j9rbwgt95uwqamjpsi9oips5syohsjk37rn5ud7ndbjq61ft',
    'ban_1bigturd8xaryj3q3q9h9xz9t69xyzqc7oketrx6dww3hbugjso7bk539q1r',
    'ban_1creepi89mp48wkyg5fktgap9j6165d8yz6g1fbe5pneinz3by9o54fuq63m',
    'ban_1defi11tou1nbhyp8y4onwsiq5jcur19xe54mcmew1xonnz6e1d1sw74yefu',
    'ban_1duckjfam7tcartyzk4eeouu17h7t8bpcjyyh4o31ih3qd7scz9w5a4u6qd4',
    'ban_1eska1qx1cd1x7tkbo4wmuofpsq69dekk7h5n6yo967kjq43nhhobrhno95x',
    'ban_1fomofudww7niykjtpzqgu9zpojtxx1f4pedjguk1gsrft44ere77sh1ky8g',
    'ban_1h11mrypctfiexeo3swn1odo78uazf8oudrbqhcpzqyxjpu7eksrad8t1shg',
    'ban_1ka1ium4pfue3uxtntqsrib8mumxgazsjf58gidh1xeo5te3whsq8z476goo',
    'ban_1kirby19w89i35yenyesnz7zqdyguzdb3e819dxrhdegdnsaphzeug39ntxj',
    'ban_1monkeyt1x77a1rp9bwtthajb8odapbmnzpyt8357ac8a1bcron34i3r9y66',
    'ban_1purian887obzya9jjrsz18eiu45dzzgr9q1mh1zg7rw1kybgx5nmr843afb',
    'ban_1wirginxksoeggr1u51a797tytmicokwnxxsosmd1q3mapuad4j6hdzeh617',
    'ban_1yekta1xn94qdnbmmj1tqg76zk3apcfd31pjmuy6d879e3mr469a4o4sdhd4',
    'ban_31dhbgirwzd3ce7naor6o94woefws9hpxu4q8uxm1bz98w89zqpfks5rk3ad',
    'ban_3fudcakefr9jyw7b4kfafrgaekmd37ez7q4pmzuo1fd7wo9jo8gsha7z7e1c',
    'ban_3hxnx1gegfqmmhcnd13qipjxgo7mbw1bwprxq7334sr5b4hie5u1wj845n6m',
];
