import {
    richListNavItem,
    accountsNavItem,
    knownAccountsNavItem,
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
        responseSchema: 'OnlineRepresentativeDto[]',
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
        route: `${accountsNavItem.route}/${knownAccountsNavItem.route}`,
        apiPath: 'accounts/known-accounts',
        responseSchema: 'KnownAccountDto[]',
        knobs: [],
        requestType: 'GET',
    },
    {
        route: `${accountsNavItem.route}/${richListNavItem.route}`,
        apiPath: 'accounts/rich-list',
        responseSchema: 'AccountAliasDto[]',
        knobs: [],
        requestType: 'GET',
    },
];
