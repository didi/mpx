module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2021,
    project: './tsconfig.eslint.json'
  },
  env: {
    es6: true,
    browser: true,
    node: true
  },
  plugins: ['@typescript-eslint', 'eslint-plugin-tsdoc'],
  extends: ['plugin:@typescript-eslint/recommended'],
  rules: {
    /* TSDOC PLUGIN RULES */
    // Enable the TSDoc plugin
    'tsdoc/syntax': 'warn',
    'comma-dangle': ['error', 'never'],
    'no-var-requires': 0
  }
}
