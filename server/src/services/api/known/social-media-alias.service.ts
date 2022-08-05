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
                    legacyTelegramAliasMap.set(entry.account, entry.user_name);
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
            res.send(data);
        })
        .catch((err) => {
            if (err.errorCode === 1 || err.errorCode === 2) {
                return res.status(400).send(err);
            }
            res.status(500).send(err);
        });
};
