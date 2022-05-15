export type CMCPriceData = {
    data: {
        [symbol: string]: {
            quote: {
                USD: {
                    price: number;
                    volume_24h: number;
                };
            };
        };
    };
};
