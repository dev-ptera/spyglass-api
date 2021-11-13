module.exports =  {
        root: true,
        parser:  '@typescript-eslint/parser',
        extends:  [ '@pxblue/eslint-doc-service-config/ts' ],
        parserOptions:  {
            project: "./tsconfig.json",
        },
        env: {
            browser: true
        }
    };
