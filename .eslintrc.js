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
    'qq': false,
    'Component': false,
    'Page': false,
    'App': false
  },
  rules: {
    'no-cond-assign': 0
  }
}
