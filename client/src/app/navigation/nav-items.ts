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

export const repNavItem: NavItem = {
    title: 'Representatives',
    route: 'representatives',
    icon: 'how_to_vote',
    children: [repLargeNavItem, repOnlineNavItem, repMonitoredNavItem],
};

const pageOneNavItem: NavItem = {
    title: 'Page 1',
    route: 'page-one',
    icon: 'looks_one',
};

const pageTwoNavItem: NavItem = {
    title: 'Page 2',
    route: 'page-two',
    icon: 'looks_two',
};

export const APP_NAV_ITEMS = {
    representative: repNavItem,
    page1: pageOneNavItem,
    page2: pageTwoNavItem,
};
