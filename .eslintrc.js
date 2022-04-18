module.exports = {
  root: true,
  parser: 'babel-eslint',
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
    getRegExp: 'readonly',
    getCurrentPages: 'readonly',
    // tenon env
    Hummer: 'readonly',
    View: 'readonly',
    Text: 'readonly',
    Dialog: 'readonly',
    __GLOBAL__: 'readonly',
  },
  rules: {
    'no-cond-assign': 0,
    'camelcase': ['error', { 'allow': ['__mpx_mode__', '__mpx_env__', '__swan_exports_map__'] }]
  },
  env: {
    'jest/globals': true
  }
}
