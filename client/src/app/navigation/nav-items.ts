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

export const wealthPercentiles: NavItem = {
    title: 'Percentiles',
    route: 'percentiles',
};

const distributionNavItem: NavItem = {
    title: 'Distribution',
    route: 'distribution',
    icon: 'looks_one',
    children: [
        supplyNavItem,
        wealthPercentiles,
    ],
};
export const knownAccountsNavItem: NavItem = {
    title: 'Known Accounts',
    route: 'known-accounts',
};
export const richListNavItem: NavItem = {
    title: 'Rich List',
    route: 'rich-list',
};
export const accountsNavItem: NavItem = {
    title: 'Accounts',
    route: 'accounts',
    icon: 'person',
    children: [knownAccountsNavItem, richListNavItem],
};

export const APP_NAV_ITEMS = [repNavItem, distributionNavItem, accountsNavItem];
