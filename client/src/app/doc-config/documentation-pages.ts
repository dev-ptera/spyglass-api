import {
    knownNavItem,
    knownAccountsNavItem, knownVanitiesNavItem,
    repAliasNavItem,
    repMonitoredNavItem,
    repNavItem,
    repOnlineNavItem,
    repRootNavItem, repUptimeNavItem,
} from '../navigation/nav-items';
import { Knob } from './knobs/Knob';
import {
    REPRESENTATIVES_UPTIME_KNOBS,
    ROOT_REPRESENTATIVES_KNOBS
} from './knobs/representatives.knobs';
import {KNOWN_ACCOUNTS_KNOBS} from "./knobs/known.knobs";

export const apiDocumentationPages: Array<{
    route: string;
    apiPath: string;
    responseSchema: string;
    knobs: Array<Knob>;
    requestType: 'GET' | 'POST';
}> = [
    {
        route: `${repNavItem.route}/${repRootNavItem.route}`,
        apiPath: 'representatives',
        responseSchema: 'RepresentativeDto[]',
        knobs: ROOT_REPRESENTATIVES_KNOBS,
        requestType: 'POST',
    },
    {
        route: `${repNavItem.route}/${repAliasNavItem.route}`,
        apiPath: 'representatives/aliases',
        responseSchema: 'AliasedRepresentativeDto[]',
        knobs: [],
        requestType: 'GET',
    },
    {
        route: `${repNavItem.route}/${repOnlineNavItem.route}`,
        apiPath: 'representatives/online',
        responseSchema: 'OnlineRepresentativeDto[]', // TODO: Fix type!
        knobs: [],
        requestType: 'GET',
    },
    {
        route: `${repNavItem.route}/${repUptimeNavItem.route}`,
        apiPath: 'representatives/uptime',
        responseSchema: 'RepresentativeUptimeDto[]',
        knobs: REPRESENTATIVES_UPTIME_KNOBS,
        requestType: 'POST',
    },
    {
        route: `${repNavItem.route}/${repMonitoredNavItem.route}`,
        apiPath: 'representatives/monitored',
        responseSchema: 'MonitoredRepresentativeDto[]',
        knobs: [],
        requestType: 'GET',
    },
    {
        route: `${knownNavItem.route}/${knownAccountsNavItem.route}`,
        apiPath: 'known/accounts',
        responseSchema: 'KnownAccountDto[]', // TODO: Fix type!
        knobs: KNOWN_ACCOUNTS_KNOBS,
        requestType: 'POST',
    },
    {
        route: `${knownNavItem.route}/${knownVanitiesNavItem.route}`,
        apiPath: 'known/vanities',
        responseSchema: 'KnownVanityDto[]',
        knobs: [],
        requestType: 'GET',
    },
];
