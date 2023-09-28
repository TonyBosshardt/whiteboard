module.exports = {
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    requireConfigFile: false,
  },
  extends: ['eslint:recommended', 'airbnb-base', 'plugin:prettier/recommended'],
  plugins: ['import', 'prettier'],
  env: {
    jest: true,
    node: true,
  },
  root: true,
  rules: {
    // Prevent accidental inclusion of debugging statements.
    'no-console': 2,

    'prettier/prettier': 'error',

    // seems like a reasonable change
    'class-methods-use-this': 0,

    // Ideally we'd just set the `enforceInMethodNames` option to false, but that only allows us to
    // _define_ `-`-prefixed methods without error, not call them :P.
    'no-underscore-dangle': 0,

    // this drives me crazy in forEach loops
    'no-return-assign': ['error', 'except-parens'],

    // i think this is actually ok
    'no-param-reassign': 0,

    // `continue` can be used to write more easily readable code.
    'no-continue': 0,

    // Allow non-default exports for the sake of import destructuring and tree shaking. See
    // https://system1bio.slack.com/archives/G8Y8RJU7Q/p1548367820003300 for details.
    'import/prefer-default-export': 0,

    'import/extensions': ['error', 'always', { ignorePackages: true }],

    'import/no-relative-packages': 0,

    // newly introduced and competes with the "private class in file concept"
    'max-classes-per-file': 0,
  },
};
