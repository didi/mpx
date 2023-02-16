module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  extends: 'standard',
  settings: {
    'html/html-extensions': ['.html', '.mpx'],  // consider .html and .mpx files as HTML
  },
  plugins: [
    'html'
  ],
  globals: {
    wx: true,
    K: true,
    getApp: true,
    App: true,
    __mpx_mode__: true,
    APNG: true
  },
  rules: {
    "no-debugger": 0,
    camelcase: 0,
  },
}
