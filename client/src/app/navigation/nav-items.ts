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

const supplyNavItem: NavItem = {
    title: 'Supply',
    route: 'supply',
    icon: 'looks_one',
};

const networkNavItem: NavItem = {
    title: 'Network',
    route: 'network',
    icon: 'looks_two',
};

export const knownAccountsRootNavItem: NavItem = {
    title: 'Root',
    route: 'root',
};
export const knownAccountsAliasNavItem: NavItem = {
    title: 'Alias',
    route: 'alias',
};
export const knownAccountsNavItem: NavItem = {
    title: 'Known Accounts',
    route: 'known-accounts',
    icon: 'person',
    children: [knownAccountsRootNavItem, knownAccountsAliasNavItem],
};

export const APP_NAV_ITEMS = [repNavItem, supplyNavItem, networkNavItem, knownAccountsNavItem];
