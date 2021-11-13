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
import * as RequestParams from './request-params';
import { RequestBodyParameters } from './request-params';

export const apiDocumentationPages: Array<{
    route: string;
    apiPath: string;
    responseSchema: string;
    requestParameters: Array<RequestBodyParameters>;
    requestType: 'GET' | 'POST';
}> = [
    {
        route: `${repNavItem.route}/${repRootNavItem.route}`,
        apiPath: 'representatives',
        responseSchema: undefined,
        requestParameters: RequestParams.REPRESENTATIVES_ROOT,
        requestType: 'POST',
    },
    {
        route: `${repNavItem.route}/${repAliasNavItem.route}`,
        apiPath: 'representatives/aliased',
        responseSchema: 'AliasedRepresentativeDto[]',
        requestParameters: [],
        requestType: 'GET',
    },
    {
        route: `${repNavItem.route}/${repLargeNavItem.route}`,
        apiPath: 'representatives/large',
        responseSchema: 'LargeRepresentativeDto[]',
        requestParameters: RequestParams.REPRESENTATIVES_LARGE,
        requestType: 'POST',
    },
    {
        route: `${repNavItem.route}/${repOnlineNavItem.route}`,
        apiPath: 'representatives/online',
        responseSchema: 'OnlineRepresentativeDto[]',
        requestParameters: [],
        requestType: 'GET',
    },
    {
        route: `${repNavItem.route}/${repOnlineNavItem.route}`,
        apiPath: 'representatives/online',
        responseSchema: 'OnlineRepresentativeDto[]',
        requestParameters: [],
        requestType: 'GET',
    },
    {
        route: `${repNavItem.route}/${repMonitoredNavItem.route}`,
        apiPath: 'representatives/monitored',
        responseSchema: 'MonitoredRepresentativeDto[]',
        requestParameters: [],
        requestType: 'GET',
    },
    {
        route: `${knownAccountsNavItem.route}/${knownAccountsRootNavItem.route}`,
        apiPath: 'accounts/known',
        responseSchema: 'KnownAccountDto[]',
        requestParameters: [],
        requestType: 'GET',
    },
    {
        route: `${knownAccountsNavItem.route}/${knownAccountsAliasNavItem.route}`,
        apiPath: 'knownAccounts/alias',
        responseSchema: undefined,
        requestParameters: [],
        requestType: 'GET',
    },
];
