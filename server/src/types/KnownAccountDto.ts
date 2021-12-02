export type KnownAccountDto = {
    address: string;
    alias: string;
    owner?: string;
    type?: KnownAccountType;
};

export type KnownAccountType =
    | ''
    | 'representative'
    | 'exchange'
    | 'developer'
    | 'faucet'
    | 'explorer'
    | 'citizen'
    | 'burn';
