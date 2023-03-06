export type KnownAccountDto = {
    address: string;
    alias: string;
    owner?: string;
    type?: string;
    lore?: string;
    balance?: number;
    hasLore: boolean;
};
