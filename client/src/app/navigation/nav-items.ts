export type NavItem = {
    title: string;
    route: string;
    icon?: string;
    children?: NavItem[];
};

export const largeRepNavItem: NavItem = {
    title: 'Large',
    route: 'large',
};

export const repNavItem: NavItem = {
    title: 'Representatives',
    route: 'representatives',
    icon: 'looks_zero',
    children: [largeRepNavItem],
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
