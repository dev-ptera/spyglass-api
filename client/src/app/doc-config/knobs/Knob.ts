export type Knob<> = {
    /** Some properties will be required in the POST request body. Default is false. */
    required?: boolean;
    /** This is a property name in a POST request body sent to the server. */
    propertyName: string;
    /** The type of expected input. */
    propertyType: 'array' | 'number' | 'string' | 'boolean';
    /** The API may have an internal default value set for any optional params. */
    defaultValue?: Array<number | string> | number | string | boolean | undefined | bigint;
    /** Anything of interest for a user to know. */
    notes?: string;
    /** This is populated by the user. */
    value?: any;
    /** Replaces the placeholder in the rest url endpoint. */
    restPathAlias?: string;
};
