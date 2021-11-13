import {
    knownAccountsAliasNavItem,
    knownAccountsNavItem,
    knownAccountsRootNavItem, repAliasNavItem,
    repLargeNavItem,
    repMonitoredNavItem,
    repNavItem,
    repOnlineNavItem,
    repRootNavItem,
} from '../navigation/nav-items';
import {Knob} from "./knobs/Knob";
import {LARGE_REPRESENTATIVES_KNOBS} from "./knobs/large-representatives.knobs";

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
        responseSchema: undefined,
        knobs: [],
        requestType: 'POST',
    },
    {
        route: `${repNavItem.route}/${repAliasNavItem.route}`,
        apiPath: 'representatives/aliased',
        responseSchema: 'AliasedRepresentativeDto[]',
        knobs: [],
        requestType: 'GET',
    },
    {
        route: `${repNavItem.route}/${repLargeNavItem.route}`,
        apiPath: 'representatives/large',
        responseSchema: 'LargeRepresentativeDto[]',
        knobs: LARGE_REPRESENTATIVES_KNOBS,
        requestType: 'POST',
    },
    {
        route: `${repNavItem.route}/${repOnlineNavItem.route}`,
        apiPath: 'representatives/online',
        responseSchema: 'OnlineRepresentativeDto[]',
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
        route: `${repNavItem.route}/${repMonitoredNavItem.route}`,
        apiPath: 'representatives/monitored',
        responseSchema: 'MonitoredRepresentativeDto[]',
        knobs: [],
        requestType: 'GET',
    },
    {
        route: `${knownAccountsNavItem.route}/${knownAccountsRootNavItem.route}`,
        apiPath: 'accounts/known',
        responseSchema: 'KnownAccountDto[]',
        knobs: [],
        requestType: 'GET',
    },
    {
        route: `${knownAccountsNavItem.route}/${knownAccountsAliasNavItem.route}`,
        apiPath: 'knownAccounts/alias',
        responseSchema: undefined,
        knobs: [],
        requestType: 'GET',
    },
];
