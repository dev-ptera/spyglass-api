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
import {LARGE_REPRESENTATIVES_KNOBS, ROOT_REPRESENTATIVES_KNOBS} from "./knobs/representatives.knobs";

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
        route: `${repNavItem.route}/${repLargeNavItem.route}`,
        apiPath: 'representatives/large',
        responseSchema: 'LargeRepresentativeDto[]',
        knobs: LARGE_REPRESENTATIVES_KNOBS,
        requestType: 'POST',
    },
    {
        route: `${repNavItem.route}/${repOnlineNavItem.route}`,
        apiPath: 'representatives/online-reps.3',
        responseSchema: 'OnlineRepresentativeDto[]',
        knobs: [],
        requestType: 'GET',
    },
    {
        route: `${repNavItem.route}/${repOnlineNavItem.route}`,
        apiPath: 'representatives/online-reps.3',
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
        apiPath: 'accounts/aliases',
        responseSchema: 'AccountAliasDto[]',
        knobs: [],
        requestType: 'GET',
    },
];
