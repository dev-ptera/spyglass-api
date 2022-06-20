export type AccountNFTDto = {
    name: string;
    image: string;
    description: string;
    properties: {
        issuer: string;
        supply_block_hash: string;
    };
    certain: boolean;
    receive_hash: string;
    rep: string;
    quantity: number;
};
