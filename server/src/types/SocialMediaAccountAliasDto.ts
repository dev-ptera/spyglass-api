export type SocialMediaAccountAliasDto = {
    address: string;
    alias: string;
    platform: 'twitter' | 'discord' | 'telegram' | 'jungletv';
    platformUserId: string;
};
