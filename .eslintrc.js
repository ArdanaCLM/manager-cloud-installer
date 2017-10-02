module.exports = {
  'env': {
    'browser': true,
    'es6': true,
    'node': true
  },
  'extends': [
    'eslint:recommended'
  ],
  'parser': 'babel-eslint',
  'parserOptions': {
    'ecmaVersion': 6,
    'ecmaFeatures': {
      'experimentalObjectRestSpread': true,
      'jsx': true
    },
    'sourceType': 'module'
  },
  'plugins': [
    'react'
  ],
  'rules': {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['warn', 'single'],
    'max-len': ['error', 120],
    'semi': ['error', 'always'],
    'eol-last': 'error',
    'space-in-parens': ['error', 'never'],
    'space-before-blocks': ['error', 'always'],
    'no-console': 'warn',
    'no-trailing-spaces': 'error',
    'no-unused-vars': ["error", { "vars": "all", "args": "none", "ignoreRestSiblings": false}],
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
  }
};
