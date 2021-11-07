export type NavItem = {
    title: string;
    route: string;
    icon?: string;
    children?: NavItem[];
};

export const repLargeNavItem: NavItem = {
    title: 'Large',
    route: 'large',
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
    title: 'Root',
    route: 'root',
};

export const repNavItem: NavItem = {
    title: 'Representatives',
    route: 'representatives',
    icon: 'how_to_vote',
    children: [repRootNavItem, repLargeNavItem,  repMonitoredNavItem, repOnlineNavItem, repUptimeNavItem],
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

export const APP_NAV_ITEMS = {
    representative: repNavItem,
    supply: supplyNavItem,
    network: networkNavItem,
};
