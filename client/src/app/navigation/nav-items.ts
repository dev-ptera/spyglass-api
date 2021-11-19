export type NavItem = {
    title: string;
    route: string;
    icon?: string;
    children?: NavItem[];
};

export const repOnlineNavItem: NavItem = {
    title: 'Online',
    route: 'online',
};

export const repMonitoredNavItem: NavItem = {
    title: 'Monitored',
    route: 'monitored',
};

export const repUptimeNavItem: NavItem = {
    title: 'Uptime',
    route: 'uptime',
};

export const repRootNavItem: NavItem = {
    title: 'Representatives',
    route: 'representatives',
};

export const repAliasNavItem: NavItem = {
    title: 'Aliases',
    route: 'aliased',
};

export const repNavItem: NavItem = {
    title: 'Representatives',
    route: 'representatives',
    icon: 'how_to_vote',
    children: [
        repAliasNavItem,
        repMonitoredNavItem,
        repOnlineNavItem,
        repRootNavItem,
        repUptimeNavItem,
    ],
};


export const supplyNavItem: NavItem = {
    title: 'Supply',
    route: 'supply',
};

export const developerFundsNavItem: NavItem = {
    title: 'Developer Funds',
    route: 'developer-funds',
};

export const wealthPercentiles: NavItem = {
    title: 'Percentiles',
    route: 'percentiles',
};

export const distributionNavItem: NavItem = {
    title: 'Distribution',
    route: 'distribution',
    icon: 'precision_manufacturing',
    children: [
        developerFundsNavItem,
        supplyNavItem,
    //    wealthPercentiles,
    ],
};
export const knownAccountsNavItem: NavItem = {
    title: 'Accounts',
    route: 'known',
};
export const knownVanitiesNavItem: NavItem = {
    title: 'Vanities',
    route: 'vanities',
};
export const knownNavItem: NavItem = {
    title: 'Known',
    route: 'known',
    icon: 'verified',
    children: [knownAccountsNavItem, knownVanitiesNavItem],
};

export const APP_NAV_ITEMS = [
//    accountNavItem,
    distributionNavItem,
    knownNavItem,
    repNavItem
];
