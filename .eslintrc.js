module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module'
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'standard'
  ],
  plugins: [
    '@typescript-eslint',
    'html',
    'jest'
  ],
  globals: {
    wx: 'readonly',
    my: 'readonly',
    swan: 'readonly',
    qq: 'readonly',
    tt: 'readonly',
    jd: 'readonly',
    qa: 'readonly',
    dd: 'readonly',
    Component: 'readonly',
    Page: 'readonly',
    App: 'readonly',
    __mpx_mode__: 'readonly',
    __mpx_env__: 'readonly',
    getRegExp: 'readonly',
    getCurrentPages: 'readonly'
  },
  rules: {
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/ban-ts-comment': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    'no-cond-assign': 0,
    camelcase: 0
  },
  env: {
    'jest/globals': true,
    es6: true,
    browser: true,
    node: true
  }
}
