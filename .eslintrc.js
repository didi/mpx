module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  parserOptions: {
    sourceType: 'module'
  },
  extends: 'standard',
  plugins: ['html', 'jest'],
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
    getCurrentPages: 'readonly',
    __DEV__: 'readonly'
  },
  rules: {
    'no-cond-assign': 0,
    camelcase: 0,
    indent: 0
  },
  env: {
    'jest/globals': true
  },
  // no-prototype-builtins
  overrides: [
    // tests, no restrictions
    {
      files: ['**/__tests__/**'],
      rules: {
        'no-unused-expressions': 'off',
        'prefer-const': 'off',
        'no-sequences': 'off',
        'no-prototype-builtins': 'off',
        'no-proto': 'off'
      }
    },
    {
      files: [
        'packages/**/**'
      ],
      rules: {
        'no-prototype-builtins': 'off'
      }
    }
  ]
}
