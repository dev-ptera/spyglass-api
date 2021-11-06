import { largeRepNavItem, repNavItem } from '../../navigation/nav-items';

export type RequestBodyParameters = {
    propertyName: string;
    propertyType: 'array' | 'number' | 'string' | 'boolean',
    defaultValue: Array<number | string> | number | string;
    min?: number;
    max?: number;
};

export const requestPages: Array<{
    route: string;
    requestPath: string;
    body: Array<RequestBodyParameters>;
}> = [
    {
        route: `${repNavItem.route}/${largeRepNavItem.route}`,
        requestPath: 'representatives/large',
        body: [
            {
                propertyName: 'minimumWeight',
                propertyType: 'number',
                defaultValue: 100000,
            },
        ],
    },
];
