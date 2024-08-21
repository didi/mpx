module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  parserOptions: {
    sourceType: 'module'
  },
  extends: 'standard',
  plugins: [
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
    __mpx_dynamic_runtime__: 'readonly',
    getRegExp: 'readonly',
    getCurrentPages: 'readonly'
  },
  rules: {
    'no-cond-assign': 0,
    camelcase: 0,
    indent: 0
  },
  env: {
    'jest/globals': true,
    browser: true
  },
  overrides: [
    {
      files: ['packages/compiler-core/**/*.ts'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended'
      ],
      rules: {
        // '@typescript-eslint/no-non-null-assertion': 'off',
        // '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-types': 'off',
        'operator-linebreak': 'off',
        'comma-dangle': ['error', 'only-multiline'],
        // ts 类型不必在前定义，非类型的预期错误也能通过 ts 校验提示
        'no-use-before-define': 'off'
      },
      plugins: ['@typescript-eslint']
    }
  ]
}
