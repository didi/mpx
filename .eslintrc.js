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
  'globals': {
    'wx': false,
    'my': false,
    'swan': false,
    'qq': false,
    'tt': false,
    'Component': false,
    'Page': false,
    'App': false,
    '__mpx_mode__': false,
    'getRegExp': false
  },
  rules: {
    'no-cond-assign': 0,
    'camelcase': ['error', {'allow': ['__mpx_mode__', '__swan_exports_map__']}]
  },
  env: {
    'jest/globals': true
  }
}
