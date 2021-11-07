export * from './representative.params';

export type RequestBodyParameters = {
    /** Some properties will be required in the POST request body. */
    required: boolean;
    /** This is a property name in a POST request body sent to the server. */
    propertyName: string;
    /** The type of expected input. */
    propertyType: 'array' | 'number' | 'string' | 'boolean';
    /** The API may have an internal default value set for any optional params. */
    defaultValue: Array<number | string> | number | string | boolean | undefined;
    /** Anything of interest for a user to know. */
    notes?: string;
    /** This is populated by the user. */
    value?: any;
};
