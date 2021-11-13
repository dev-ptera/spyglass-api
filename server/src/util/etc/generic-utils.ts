/** Wait interval in milliseconds. */
export const sleep = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

export const defineBodyParams = (paramNames: string[]): any => {
    let params = {};
    for (const name of paramNames) {
        params[name] = name;
    }
    return params;
};
