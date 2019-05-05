module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  extends: 'standard',
  plugins: [
    'html'
  ],
  'globals': {
    'wx': false,
    'my': false,
    'swan': false,
    'Component': false,
    'Page': false,
    'App': false,
    '__mpx_mode__': false,
    'getRegExp': false
  },
  rules: {
    'no-cond-assign': 0,
    "camelcase": ['error', {'allow': ['__mpx_mode__']}]
  }
}
