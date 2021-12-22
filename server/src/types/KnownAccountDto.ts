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
    | 'distribution'
    | 'faucet'
    | 'explorer'
    | 'citizen'
    | 'burn';
