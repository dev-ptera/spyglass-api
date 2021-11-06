import { LOG_ERR, LOG_INFO } from '@app/services';
import { CMCPriceData, PriceDataDto } from '@app/types';
import { AppCache } from '@app/config';
import axios, { AxiosError, AxiosResponse } from 'axios';

const method = 'GET';
const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
const headers = {
    'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY,
};

const getBananoPrice = (): Promise<CMCPriceData> =>
    new Promise<CMCPriceData>((resolve, reject) => {
        axios
            .request({
                method,
                url,
                headers,
                params: {
                    symbol: 'BAN',
                },
            })
            .then((response: AxiosResponse<CMCPriceData>) => resolve(response.data))
            .catch((err: AxiosError) => {
                reject(LOG_ERR('getBananoPrice', err));
            });
    });

const getBitcoinPrice = (): Promise<CMCPriceData> =>
    new Promise<CMCPriceData>((resolve, reject) => {
        axios
            .request({
                method,
                url,
                headers,
                params: {
                    symbol: 'BTC',
                },
            })
            .then((response: AxiosResponse<CMCPriceData>) => resolve(response.data))
            .catch((err: AxiosError) => {
                reject(LOG_ERR('getBitcoinPrice', err));
            });
    });

const getPrice = (): Promise<PriceDataDto> => {
    return Promise.all([getBananoPrice(), getBitcoinPrice()])
        .then((results) => {
            const dto: PriceDataDto = {
                bananoPriceUsd: results[0].data.BAN.quote.USD.price,
                bitcoinPriceUsd: results[1].data.BTC.quote.USD.price,
            };
            return Promise.resolve(dto);
        })
        .catch((err) => {
            return Promise.reject(err);
        });
};

/** This is called to update the Price Data in the AppCache.  Reads price data from CoinMarketCap. */
export const cachePriceData = async (): Promise<void> => {
    return new Promise((resolve) => {
        const start = LOG_INFO('Refreshing Price Data');
        getPrice()
            .then((data) => {
                AppCache.priceData = data;
                resolve(LOG_INFO('Price Data Updated', start));
            })
            .catch((err) => {
                resolve(LOG_ERR('cachePriceData', err));
            });
    });
};
