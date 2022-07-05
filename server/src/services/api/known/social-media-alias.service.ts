import { isValidAddress } from '@app/services';
import { SocialMediaAccountAliasDto } from '@app/types';
import axios, { AxiosError, AxiosResponse } from 'axios';


type DiscordApiResponse = {
    user_id: number;
    user_last_known_name: string;
    address: string;
};

const getDiscordAlias = (address: string): Promise<SocialMediaAccountAliasDto> =>
    new Promise<SocialMediaAccountAliasDto>((resolve) => {
        axios
            .get(`https://bananobotapi.banano.cc/ufw/${address}`)
            .then((response: AxiosResponse<DiscordApiResponse[]>) => {
                resolve({
                    address,
                    alias: response.data[0].user_last_known_name,
                    platform: 'discord',
                });
            })
            .catch((err: AxiosError) => {
                // LOG_ERR('getDiscordAlias', err);
                resolve({
                    address,
                    alias: undefined,
                    platform: undefined,
                });
            });
    });

type TwitterApiResponse = {
    system: string;
    user_id: number;
    user_name: string;
};

const getTwitterAlias = (address: string): Promise<SocialMediaAccountAliasDto> =>
    new Promise<SocialMediaAccountAliasDto>((resolve) => {
        axios
            .get(`https://ba.nanotipbot.com/users/${address}`)
            .then((response: AxiosResponse<TwitterApiResponse>) => {
                resolve({
                    address,
                    alias: response.data.user_name,
                    platform: response.data.system,
                });
            })
            .catch((err: AxiosError) => {
                // LOG_ERR('getTwitterAlias', err);
                resolve({
                    address,
                    alias: undefined,
                    platform: undefined,
                });
            });
    });

const getKnownSocialMediaAccountAliasPromise = (address: string): Promise<SocialMediaAccountAliasDto> => {
    if (!address) {
        return Promise.reject({ errorMsg: 'Address is required', errorCode: 1 });
    }
    if (!isValidAddress(address)) {
        return Promise.reject({ errorMsg: 'Invalid address', errorCode: 2 });
    }

    return Promise.all([getDiscordAlias(address), getTwitterAlias(address)]).then(([discord, twitter]) => ({
        address,
        alias: discord.alias || twitter.alias,
        platform: discord.alias ? 'discord' : twitter.alias ? 'twitter' : undefined,
    }));
};

/** Checks to see if an account has an alias using the BRPD twitter & discord APIs.  */
export const getKnownSocialMediaAccountAliasV1 = (req, res): void => {
    const parts = req.url.split('/');
    const address = parts[parts.length - 1];

    getKnownSocialMediaAccountAliasPromise(address)
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            if (err.errorCode === 1 || err.errorCode === 2) {
                return res.status(400).send(err);
            }
            res.status(500).send(err);
        });
};
