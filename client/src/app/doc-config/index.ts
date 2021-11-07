import {
    repLargeNavItem,
    repMonitoredNavItem,
    repNavItem,
    repOnlineNavItem,
    repRootNavItem
} from '../navigation/nav-items';
import * as ResponseTypes from './response-types';
import * as RequestParams from './request-params';
import { RequestBodyParameters } from './request-params';

export const apiDocumentationPages: Array<{
    route: string;
    apiPath: string;
    responseType: Object;
    requestParameters: Array<RequestBodyParameters>;
}> = [
    {
        route: `${repNavItem.route}/${repRootNavItem.route}`,
        apiPath: 'representatives',
        responseType: ResponseTypes.REPRESENTATIVES_ROOT,
        requestParameters: RequestParams.REPRESENTATIVES_ROOT,
    },
    {
        route: `${repNavItem.route}/${repLargeNavItem.route}`,
        apiPath: 'representatives/large',
        responseType: ResponseTypes.REPRESENTATIVES_LARGE,
        requestParameters: RequestParams.REPRESENTATIVES_LARGE,
    },
    {
        route: `${repNavItem.route}/${repOnlineNavItem.route}`,
        apiPath: 'representatives/online',
        responseType: ResponseTypes.REPRESENTATIVES_ONLINE,
        requestParameters: [],
    },
    {
        route: `${repNavItem.route}/${repMonitoredNavItem.route}`,
        apiPath: 'representatives/monitored',
        responseType: ResponseTypes.REPRESENTATIVES_MONITORED,
        requestParameters: [],
    },
];
