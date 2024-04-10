import { isValidAddress, LOG_ERR, LOG_INFO } from '@app/services';
import { SocialMediaAccountAliasDto } from '@app/types';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { JTV_QUEUE_ADDRESSES } from './jungle-tv';
const JSONBig = require('json-bigint');

type OldTelegramAlias = {
    account: string;
    user_name: string;
};
type DiscordApiResponse = {
    user_id: string;
    user_last_known_name: string;
    address: string;
};

const legacyTelegramAliasMap = new Map<string, string>();
export const knownSocialMediaAccounts = new Map<string, SocialMediaAccountAliasDto>();

export const cacheSocialMediaAccounts = async (): Promise<void> => {
    /* Discord */
    const startDiscord = LOG_INFO('Refreshing all Discord Aliases');
    axios
        .get('https://bananobotapi.banano.cc/users', {
            headers: {
                Authorization: process.env.BANANOBOTAPI_API_KEY || '',
            },
            transformResponse: [
                (data) => {
                    // API returns `user_id` as a number, but it is a BigInt & the value is transformed during a normal JSON.parse.
                    return JSONBig.parse(data);
                },
            ],
        })
        .then((response: AxiosResponse<DiscordApiResponse[]>) => {
            response.data.map((account) => {
                if (account.user_id) {
                    knownSocialMediaAccounts.set(account.address, {
                        address: account.address,
                        alias: account.user_last_known_name,
                        platform: 'discord',
                        platformUserId: account.user_id,
                    });
                }
            });
            LOG_INFO('Discord users updated', startDiscord);
            LOG_INFO(`Known Social Media Account Size: ${knownSocialMediaAccounts.size}`);
        })
        .catch((err: AxiosError) => {
            LOG_ERR('fetchAllDiscordAccount', err);
        });
};

/** This list of telegram addresses is not currently (7.6.22) available in the `getTelegramAndTwitterAlias` response.
 *  Call this function when the API initializes and store the response in a local map for reference.
 *  Ask Kirby when this will no longer be required.
 * */
export const getOldTelegramAliases = (): Promise<void> => {
    LOG_INFO('Fetching legacy telegram aliases');
    return new Promise<void>((resolve) => {
        axios
            .get(`https://raw.githubusercontent.com/Kirby1997/Banano/master/telegram_old.json`)
            .then((response: AxiosResponse<OldTelegramAlias[]>) => {
                response.data.map((account) => {
                    if (account.user_name) {
                        legacyTelegramAliasMap.set(account.account, account.user_name);
                        knownSocialMediaAccounts.set(account.account, {
                            address: account.account,
                            alias: account.user_name,
                            platform: 'telegram',
                            platformUserId: undefined,
                        });
                    }
                });
                resolve();
            })
            .catch((err: AxiosError) => {
                LOG_ERR('getOldTelegramAliases', err);
                resolve();
            });
    });
};

export const getAddressFromDiscordUserId = (req, res): void => {
    const parts = req.url.split('/');
    const discordId = parts[parts.length - 1];
    axios
        .get(`https://bananobotapi.banano.cc/wfu/${discordId}`, {
            headers: {
                Authorization: process.env.BANANOBOTAPI_API_KEY || '',
            },
            transformResponse: [
                (data) => {
                    // API returns `user_id` as a number, but it is a BigInt & the value is transformed during a normal JSON.parse.
                    return JSONBig.parse(data);
                },
            ],
        })
        .then((response: AxiosResponse<DiscordApiResponse[]>) => {
            res.send([
                {
                    address: response.data[0].address,
                    user_last_known_name: response.data[0].user_last_known_name,
                    user_id: String(response.data[0].user_id),
                },
            ]);
        })
        .catch((err: AxiosError) => {
            LOG_ERR('getAddressFromDiscordUserId', err);
        });
};

const getDiscordAlias = (address: string): Promise<SocialMediaAccountAliasDto> =>
    new Promise<SocialMediaAccountAliasDto>((resolve) => {
        axios
            .get(`https://bananobotapi.banano.cc/ufw/${address}`, {
                headers: {
                    Authorization: process.env.BANANOBOTAPI_API_KEY || '',
                },
                transformResponse: [
                    (data) => {
                        // API returns `user_id` as a number, but it is a BigInt & the value is transformed during a normal JSON.parse.
                        return JSONBig.parse(data);
                    },
                ],
            })
            .then((response: AxiosResponse<DiscordApiResponse[]>) => {
                resolve({
                    address,
                    alias: response.data[0].user_last_known_name,
                    platform: 'discord',
                    platformUserId: String(response.data[0].user_id),
                });
            })
            .catch((err: AxiosError) => {
                // LOG_ERR('getDiscordAlias', err);
                resolve({
                    address,
                    alias: undefined,
                    platform: undefined,
                    platformUserId: undefined,
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

    // Check legacy telegram map first.
    if (legacyTelegramAliasMap.has(address)) {
        return Promise.resolve({
            address,
            alias: legacyTelegramAliasMap.get(address),
            platform: 'telegram',
            platformUserId: undefined,
        });
    }

    // Check jungle tv enqueue addresses.
    if (JTV_QUEUE_ADDRESSES.has(address)) {
        return Promise.resolve({
            address,
            alias: 'JTV Queue',
            platform: 'jungletv',
            platformUserId: undefined,
        });
    }

    // Check if account is registered as a known account, (non social media)
    // TODO

    // Check if the account is in the cache.
    if (knownSocialMediaAccounts.has(address)) {
        return Promise.resolve(knownSocialMediaAccounts.get(address));
    }

    // Check remote APIs (discord, twitter, telegram)
    return getDiscordAlias(address).then((discord) => ({
        address,
        alias: discord.alias,
        platform: discord.platform,
        platformUserId: discord.platformUserId,
    }));
};

/** Checks to see if an account has an alias using the BRPD twitter & discord APIs.  */
export const getKnownSocialMediaAccountAliasV1 = (req, res): void => {
    const parts = req.url.split('/');
    const address = parts[parts.length - 1];

    getKnownSocialMediaAccountAliasPromise(address)
        .then((data) => {
            if (data.platformUserId) {
                knownSocialMediaAccounts.set(address, data);
            }
            res.send(data);
        })
        .catch((err) => {
            if (err.errorCode === 1 || err.errorCode === 2) {
                return res.status(400).send(err);
            }
            res.status(500).send(err);
        });
};
