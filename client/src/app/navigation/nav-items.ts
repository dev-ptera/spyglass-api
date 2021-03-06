export type NavItem = {
    title: string;
    route: string;
    icon?: string;
    children?: NavItem[];
    expanded?: boolean;
};

/** Account */
export const accountBlockAtHeight: NavItem = {
    title: 'Block at Height',
    route: 'block-at-height',
};
export const confirmedTxNavItem: NavItem = {
    title: 'Confirmed Tx',
    route: 'confirmed',
};
export const accountDelegatorsNavItem: NavItem = {
    title: 'Delegators',
    route: 'delegators',
};
export const accountExport: NavItem = {
    title: 'Export',
    route: 'export',
};
export const accountInsightsNavItem: NavItem = {
    title: 'Insights',
    route: 'insights',
};
export const accountOverviewNavItem: NavItem = {
    title: 'Overview',
    route: 'overview',
};
export const accountRepresentativeNavItem: NavItem = {
    title: 'Representative',
    route: 'representative',
};
export const receivableTxNavItem: NavItem = {
    title: 'Receivable Tx',
    route: 'receivable',
};
export const accountNavItemParent: NavItem = {
    title: 'Account',
    route: 'account',
    icon: 'account_balance_wallet',
    children: [
        accountBlockAtHeight,
        confirmedTxNavItem,
        accountDelegatorsNavItem,
        accountExport,
        accountInsightsNavItem,
        accountOverviewNavItem,
        accountRepresentativeNavItem,
        receivableTxNavItem,
    ],
};

/** Block */
export const blockNavItem: NavItem = {
    title: 'Block',
    route: 'block',
};
export const blocksNavItem: NavItem = {
    title: 'Blocks',
    route: 'blocks',
};
export const blockNavItemParent: NavItem = {
    title: 'Block',
    route: 'block',
    icon: 'receipt_long',
    children: [blockNavItem, blocksNavItem],
};

/** Distribution */
export const burnNavItem: NavItem = {
    title: 'Burn',
    route: 'burn',
};
export const distributionBuckets: NavItem = {
    title: 'Buckets',
    route: 'buckets',
};
export const developerFundsNavItem: NavItem = {
    title: 'Developer Funds',
    route: 'developer-funds',
};
export const richListNavItem: NavItem = {
    title: 'Rich List',
    route: 'rich-list',
};
export const richListSnapshotNavItem: NavItem = {
    title: 'Rich List Snapshot',
    route: 'rich-list-snapshot',
};
export const supplyNavItem: NavItem = {
    title: 'Supply',
    route: 'supply',
};
export const distributionNavItemParent: NavItem = {
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

/** Known */
export const knownAccountsNavItem: NavItem = {
    title: 'Accounts',
    route: 'accounts',
};
export const knownVanitiesNavItem: NavItem = {
    title: 'Vanities',
    route: 'vanities',
};
export const knownNavItemParent: NavItem = {
    title: 'Known',
    route: 'known',
    icon: 'fingerprint',
    children: [knownAccountsNavItem, knownVanitiesNavItem],
};

/** Network */
export const ledgerSizeNavItem: NavItem = {
    title: 'Ledger Size',
    route: 'ledger-size',
};
export const ncNavItem: NavItem = {
    title: 'Nakamoto Coefficient',
    route: 'nakamoto-coefficient',
};
export const nodeStatsNavItem: NavItem = {
    title: 'Node Stats',
    route: 'node-stats',
};
export const peerVersionsNavItem: NavItem = {
    title: 'Peer Versions',
    route: 'peer-versions',
};
export const quorumNavItem: NavItem = {
    title: 'Quorum',
    route: 'quorum',
};
export const networkNavItemParent: NavItem = {
    title: 'Network',
    route: 'network',
    icon: 'share',
    children: [ledgerSizeNavItem, ncNavItem, nodeStatsNavItem, peerVersionsNavItem, quorumNavItem],
};

/** Representative */
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
export const repScoresNavItem: NavItem = {
    title: 'Scores',
    route: 'scores',
};
export const repUptimeNavItem: NavItem = {
    title: 'Uptime',
    route: 'uptime',
};
export const prWeightRequirementNavItem: NavItem = {
    title: 'PR Weight',
    route: 'pr-weight',
};
export const repNavItemParent: NavItem = {
    title: 'Representatives',
    route: 'representatives',
    icon: 'how_to_vote',
    children: [
        repAliasNavItem,
        repMonitoredNavItem,
        repOnlineNavItem,
        prWeightRequirementNavItem,
        repRootNavItem,
        repScoresNavItem,
        repUptimeNavItem,
    ],
};

/** Price */
export const priceNavItem: NavItem = {
    title: 'Price',
    route: 'price',
    icon: 'currency_bitcoin',
};

export const APP_NAV_ITEMS = [
    accountNavItemParent,
    blockNavItemParent,
    distributionNavItemParent,
    knownNavItemParent,
    networkNavItemParent,
    priceNavItem,
    repNavItemParent,
];
