export type NavItem = {
    title: string;
    route: string;
    icon?: string;
    children?: NavItem[];
};

export const repAliasNavItem: NavItem = {
    title: 'Aliases',
    route: 'aliased',
};
export const repMonitoredNavItem: NavItem = {
    title: 'Monitored',
    route: 'monitored',
};
export const repOnlineNavItem: NavItem = {
    title: 'Online',
    route: 'online',
};
export const repRootNavItem: NavItem = {
    title: 'Representatives',
    route: 'representatives',
};
export const repUptimeNavItem: NavItem = {
    title: 'Uptime',
    route: 'uptime',
};
export const prWeightRequirementNavItem: NavItem = {
    title: 'PR Weight',
    route: 'pr-weight',
};
export const repNavItem: NavItem = {
    title: 'Representatives',
    route: 'representatives',
    icon: 'how_to_vote',
    children: [
        repAliasNavItem,
        repMonitoredNavItem,
        repOnlineNavItem,
        prWeightRequirementNavItem,
        repRootNavItem,
        repUptimeNavItem,
    ],
};

export const burnNavItem: NavItem = {
    title: 'Burn',
    route: 'burn',
};

export const supplyNavItem: NavItem = {
    title: 'Supply',
    route: 'supply',
};

export const developerFundsNavItem: NavItem = {
    title: 'Developer Funds',
    route: 'developer-funds',
};

export const distributionBuckets: NavItem = {
    title: 'Buckets',
    route: 'buckets',
};
export const richListNavItem: NavItem = {
    title: 'Rich List',
    route: 'rich-list',
};
export const richListSnapshotNavItem: NavItem = {
    title: 'Rich List Snapshot',
    route: 'rich-list-snapshot',
};

export const distributionNavItem: NavItem = {
    title: 'Distribution',
    route: 'distribution',
    icon: 'logo_dev',
    children: [
        burnNavItem,
        distributionBuckets,
        developerFundsNavItem,
        richListNavItem,
        richListSnapshotNavItem,
        supplyNavItem,
    ],
};
export const knownAccountsNavItem: NavItem = {
    title: 'Accounts',
    route: 'accounts',
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

export const peerVersionsNavItem: NavItem = {
    title: 'Peer Versions',
    route: 'peer-versions',
};
export const quorumNavItem: NavItem = {
    title: 'Quorum',
    route: 'quorum',
};
export const ncNavItem: NavItem = {
    title: 'Nakamoto Coefficient',
    route: 'nakamoto-coefficient',
};
export const networkNavItem: NavItem = {
    title: 'Network',
    route: 'network',
    icon: 'share',
    children: [ncNavItem, peerVersionsNavItem, quorumNavItem],
};

export const accountInsightsNavItem: NavItem = {
    title: 'Insights',
    route: 'insights',
};
export const accountDelegatorsNavItem: NavItem = {
    title: 'Delegators',
    route: 'delegators',
};
export const accountHistoryNavItem: NavItem = {
    title: 'History',
    route: 'history',
};export const accountRepresentativeNavItem: NavItem = {
    title: 'Representative',
    route: 'representative',
};
export const accountNavItem: NavItem = {
    title: 'Account',
    route: 'account',
    icon: 'account_balance_wallet',
    children: [accountDelegatorsNavItem, accountHistoryNavItem, accountInsightsNavItem, accountRepresentativeNavItem],
};

export const APP_NAV_ITEMS = [
    accountNavItem,
    distributionNavItem,
    knownNavItem,
    networkNavItem,
    repNavItem,
];
