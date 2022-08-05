import { isValidAddress, LOG_ERR, LOG_INFO } from '@app/services';
import { SocialMediaAccountAliasDto } from '@app/types';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { JTV_QUEUE_ADDRESSES } from './jungle-tv';
const JSONBig = require('json-bigint');

type OldTelegramAlias = {
    account: string;
    user_name: string;
};


const legacyTelegramAliasMap = new Map<string, string>();
const discordKnownAccounts = new Map<string, SocialMediaAccountAliasDto>();
export const knownSocialMediaAccounts = new Set<string>(JTV_QUEUE_ADDRESSES);

export const cacheSocialMediaAccounts = (): void => {
        const start = LOG_INFO('Fetching all discord aliases');
        axios.get('https://bananobotapi.banano.cc/users', {
            transformResponse: [
                (data) => {
                    // API returns `user_id` as a number, but it is a BigInt & the value is transformed during a normal JSON.parse.
                    return JSONBig.parse(data);
                },
            ],
        })
            .then((response: AxiosResponse<DiscordApiResponse[]>) => {
                response.data.map((account) => {
                    if (account.user_last_known_name) {
                        discordKnownAccounts.set(account.address, {
                            address: account.address,
                            alias: account.user_last_known_name,
                            platform: 'discord',
                            platformUserId: account.user_id
                        });
                    }
                    if (account.user_id) {
                        knownSocialMediaAccounts.add(account.address);
                    }
                })
                LOG_INFO('Discord users updated', start);

        })
        .catch((err: AxiosError) => {
             LOG_ERR('fetchAllDiscordAccount', err);
        })
}



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
                response.data.map((entry) => {
                    if (entry.user_name) {
                        legacyTelegramAliasMap.set(entry.account, entry.user_name);
                        knownSocialMediaAccounts.add(entry.account);
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

type DiscordApiResponse = {
    user_id: string;
    user_last_known_name: string;
    address: string;
};

const getDiscordAlias = (address: string): Promise<SocialMediaAccountAliasDto> =>
    new Promise<SocialMediaAccountAliasDto>((resolve) => {
        axios
            .get(`https://bananobotapi.banano.cc/ufw/${address}`, {
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

type TwitGramApiResponse = {
    system: 'twitter' | 'telegram';
    user_id: string;
    user_name: string;
};

// Example: ban_1rt8orkbkw9jnfyy8gcy88c96jqhsq6henz6h35sepniikt5qkea6nzdwqsf
const getTelegramAndTwitterAlias = (address: string): Promise<SocialMediaAccountAliasDto> =>
    new Promise<SocialMediaAccountAliasDto>((resolve) => {
        axios
            .get(`https://ba.nanotipbot.com/users/${address}`)
            .then((response: AxiosResponse<TwitGramApiResponse>) => {
                resolve({
                    address,
                    alias: response.data.user_name,
                    platform: response.data.system,
                    platformUserId: String(response.data.user_id),
                });
            })
            .catch((err: AxiosError) => {
                // LOG_ERR('getTwitterAlias', err);
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

    // Check if the cache has the account.
    if (discordKnownAccounts.has(address)) {
        // Discord is the only platform where all known accounts are refreshed on an interval. Go use the API for telegram/twitter.
        return Promise.resolve(discordKnownAccounts.get(address));
    }

    // Check remote APIs (discord, twitter, telegram)
    return Promise.all([getDiscordAlias(address), getTelegramAndTwitterAlias(address)]).then(
        ([discord, teleTwitter]) => ({
            address,
            alias: discord.alias || teleTwitter.alias,
            platform: discord.platform || teleTwitter.platform,
            platformUserId: discord.platformUserId || teleTwitter.platformUserId,
        })
    );
};

/** Checks to see if an account has an alias using the BRPD twitter & discord APIs.  */
export const getKnownSocialMediaAccountAliasV1 = (req, res): void => {
    const parts = req.url.split('/');
    const address = parts[parts.length - 1];

    getKnownSocialMediaAccountAliasPromise(address)
        .then((data) => {
            if (data.platformUserId) {
                knownSocialMediaAccounts.add(address);
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
