import {
    knownNavItem,
    knownAccountsNavItem,
    knownVanitiesNavItem,
    repAliasNavItem,
    repMonitoredNavItem,
    repNavItem,
    repOnlineNavItem,
    repRootNavItem,
    repUptimeNavItem,
    distributionNavItem,
    supplyNavItem,
    developerFundsNavItem,
    networkNavItem,
    prWeightRequirementNavItem, accountNavItem, accountDelegatorsNavItem,
} from '../navigation/nav-items';
import { Knob } from './knobs/Knob';
import {
    REPRESENTATIVES_UPTIME_KNOBS,
    ROOT_REPRESENTATIVES_KNOBS
} from './knobs/representatives.knobs';
import {KNOWN_ACCOUNTS_KNOBS} from "./knobs/known.knobs";
import {ACCOUNT_DELEGATORS_KNOB} from "./knobs/account.knobs";

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
        responseSchema: 'string[]',
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
        route: `${repNavItem.route}/${prWeightRequirementNavItem.route}`,
        apiPath: 'representatives/pr-weight',
        responseSchema: 'PRWeightRequirementDto',
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
        responseSchema: 'string[]',
        knobs: [],
        requestType: 'GET',
    },
    {
        route: `${distributionNavItem.route}/${supplyNavItem.route}`,
        apiPath: 'distribution/supply',
        responseSchema: 'SupplyDto',
        knobs: [],
        requestType: 'GET',
    },
    {
        route: `${distributionNavItem.route}/${developerFundsNavItem.route}`,
        apiPath: 'distribution/developer-funds',
        responseSchema: 'DeveloperFundsDto',
        knobs: [],
        requestType: 'GET',
    },
    {
        route: `${accountNavItem.route}/${accountDelegatorsNavItem.route}`,
        apiPath: 'account/[address]/delegators',
        responseSchema: 'DelegatorsOverviewDto',
        knobs: ACCOUNT_DELEGATORS_KNOB,
        requestType: 'GET',
    },
];
