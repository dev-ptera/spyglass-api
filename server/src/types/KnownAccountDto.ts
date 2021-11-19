export type KnownAccountDto = {
    address: string;
    alias: string;
    owner?: string;
    type?: 'representative' | 'exchange' | 'developer' | 'faucet' | 'explorer' | 'citizen' | 'burn';
};
