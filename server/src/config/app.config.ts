import * as BAN from './banano/app.config';
import * as NANO from './nano/app.config';
import { NanoClient } from '@dev-ptera/nano-node-rpc';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/** Used to toggle between banano and nano profiles; 'banano' | 'nano' */
export const PROFILE = process.env.PROFILE;

export const useBananoConfig = (): boolean => PROFILE === 'banano';

/** API served from this root, example: https://api.yellowspyglass.com/banano/representatives */
export const PATH_ROOT = useBananoConfig() ? BAN.PATH_ROOT : NANO.PATH_ROOT;

/** Domains allowed to use this API */
export const URL_WHITE_LIST = useBananoConfig() ? BAN.URL_WHITE_LIST : NANO.URL_WHITE_LIST;

/** Used to read data from the BANANO node */
export const NANO_CLIENT = new NanoClient({
    url: process.env.RPC_URL,
    requestHeaders: {
        Authorization: process.env.RPC_AUTH || '',
    },
});

const calcMinutes = (mins: number) => 60000 * mins;

export const PRICE_DATA_REFRESH_INTERVAL_MS = calcMinutes(IS_PRODUCTION ? 15 : 120);
export const REPRESENTATIVES_ONLINE_REFRESH_INTERVAL_MS = calcMinutes(1);
export const REPRESENTATIVES_UPTIME_REFRESH_INTERVAL_MS = calcMinutes(1);
export const REPRESENTATIVES_MONITORED_REFRESH_INTERVAL_MS = calcMinutes(1);
export const WALLETS_REFRESH_INTERVAL_MS = calcMinutes(60 * 12);
export const KNOWN_ACCOUNTS_REFRESH_INTERVAL_MS = calcMinutes(60);

/** List of monitored representatives to counter-act low peer count. */
export const MANUAL_PEER_MONITOR_URLS = useBananoConfig()
    ? BAN.MANUAL_PEER_MONITOR_URLS
    : NANO.MANUAL_PEER_MONITOR_URLS;

/** Ledger location, used to populate ledger size stats.  Must have read permission granted. */
export const LEDGER_LOCATION = useBananoConfig() ? BAN.LEDGER_LOCATION : NANO.LEDGER_LOCATION;

/** These nodes are currently only used for the `representatives_online` rpc call to help ensure more accurate results. */
export const BACKUP_NODES = useBananoConfig() ? BAN.BACKUP_NODES : NANO.BACKUP_NODES;

/** A list of accounts with custom vanity addresses. */
export const KNOWN_VANITIES = useBananoConfig() ? BAN.KNOWN_VANITIES : NANO.KNOWN_VANITIES;

/** A list of known accounts within the ecosystem (e.g. exchanges, developer funds, burn account) */
export const KNOWN_ACCOUNTS = useBananoConfig() ? BAN.KNOWN_ACCOUNTS : NANO.KNOWN_ACCOUNTS;

/** A list of addresses that no one owns; funds sent to these addresses are considered inaccessible. */
export const BURN_ADDRESSES = useBananoConfig() ? BAN.BURN_ADDRESSES : NANO.BURN_ADDRESSES;

/** A list of addresses owned by the core team (banano team, or nano foundation) used to fuel ecosystem ambitions. */
export const DEVELOPER_FUNDS = useBananoConfig() ? BAN.DEVELOPER_FUNDS : NANO.DEVELOPER_FUNDS;

/** Minimum amount of weight a representative needs before we start tracking their uptime percentages. */
export const UPTIME_TRACKING_MIN_WEIGHT = useBananoConfig()
    ? BAN.UPTIME_TRACKING_MIN_WEIGHT
    : NANO.UPTIME_TRACKING_MIN_WEIGHT;
