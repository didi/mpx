const { userConf } = require('./config/index')

const eslintConf = {
  root: true,
  parser: '@babel/eslint-parser',
  parserOptions: {
    sourceType: 'module'
  },
  extends: 'standard',
  settings: {
    // consider .html and .mpx files as HTML
    'html/html-extensions': ['.html', '.mpx']
  },
  plugins: [
    'html'
  ],
  globals: {
    wx: 'readonly',
    getApp: 'readonly',
    App: 'readonly',
    Page: 'readonly',
    Component: 'readonly',
    __mpx_mode__: 'readonly',
    __mpx_env__: 'readonly',
    requirePlugin: 'readonly'
  },
  rules: {
    camelcase: ['error', { allow: ['__mpx_mode__', '__mpx_env__'] }]
  }
}
if (userConf.tsSupport) {
  eslintConf.overrides = [
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      extends: [
        'standard',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      plugins: ['@typescript-eslint'],
    },
  ]
}

module.exports = eslintConf
