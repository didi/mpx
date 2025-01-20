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
    Mixin: 'readonly',
    __mpx_mode__: 'readonly',
    __mpx_env__: 'readonly',
    __mpx_dynamic_runtime__: 'readonly',
    getRegExp: 'readonly',
    getCurrentPages: 'readonly'
  },
  rules: {
    'no-cond-assign': 0,
    camelcase: 0,
    indent: 0,
    'symbol-description': 0
  },
  env: {
    'jest/globals': true,
    browser: true
  },
  overrides: [
    {
      files: ['**/*.tsx', '**/*.ts'],
      parser: '@typescript-eslint/parser',
      extends: [
        'standard',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended'
      ],
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/no-explicit-any': 0,
        'no-use-before-define': 0,
        '@typescript-eslint/triple-slash-reference': 0,
        '@typescript-eslint/ban-types': 0,
        '@typescript-eslint/no-empty-interface': 0,
        '@typescript-eslint/no-unused-vars': 0,
        '@typescript-eslint/no-non-null-assertion': 0,
        camelcase: 0
      }
    }, {
      files: ['packages/webpack-plugin/lib/runtime/components/react/**/*.{js,jsx,ts,tsx}'],
      plugins: ['react-hooks'],
      rules: {
        'react-hooks/rules-of-hooks': 'error'
      }
    }
  ]
}
