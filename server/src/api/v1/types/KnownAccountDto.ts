export type KnownAccountDto = {
    address: string;
    alias: string;
    illicit?: number;
    owner?: string;
    type?: string;
    // tags?: 'representative' | 'exchange' | 'developer' | 'faucet' | 'explorer' ;
};
