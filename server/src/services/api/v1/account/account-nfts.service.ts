import { isValidAddress, LOG_ERR } from '@app/services';
import { AccountNFTDto } from '@app/types';
import axios, { AxiosError, AxiosResponse } from 'axios';

const getPrussiaNFTs = (address: string): Promise<AccountNFTDto[]> =>
    new Promise<AccountNFTDto[]>((resolve, reject) => {
        axios
            .get(`https://bannfts.prussiafan.club/api/v1/account/${address}`)
            .then((response: AxiosResponse<AccountNFTDto[]>) => resolve(response.data))
            .catch((err: AxiosError) => {
                reject(LOG_ERR('getPrussiaNFTs', err));
            });
    });

const getIpfsImage = (id: string): Promise<string> =>
    new Promise<string>((resolve, reject) => {
        axios
            .get(`https://gateway.pinata.cloud/ipfs/${id}`)
            .then((response: AxiosResponse<string>) => resolve(response.data))
            .catch((err: AxiosError) => {
                reject(LOG_ERR('getIpfsImage', err));
            });
    });

const getAccountNFTsPromise = async (address: string): Promise<AccountNFTDto[]> => {
    const ownedNfts = (await getPrussiaNFTs(address).catch((err) =>
        LOG_ERR('getAccountNFTsPromise.getPrussiaNFTs', err)
    )) as AccountNFTDto[];

    /*
    for (const nft of ownedNfts) {
        const imageData = await getIpfsImage(nft.image);
        // @ts-ignore
        nft.imageData = imageData;
    } */

    return ownedNfts;
};

export const getAccountNFTs = (req, res): void => {
    const parts = req.url.split('/');
    const address = parts[parts.length - 1];
    if (!isValidAddress(address)) {
        return res.status(500).send({ error: 'Address is required' });
    }
    getAccountNFTsPromise(address)
        .then((rep) => {
            res.send(rep);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
