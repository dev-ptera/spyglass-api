module.exports =  {
        root: true,
        parser:  '@typescript-eslint/parser',
        extends:  [ '@pxblue/eslint-doc-config/ts' ],
        parserOptions:  {
            project: "./tsconfig.json",
        },
        env: {
            browser: true
        }
    };
