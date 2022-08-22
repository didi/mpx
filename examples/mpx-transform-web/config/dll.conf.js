const { resolve, resolveSrc } = require('../build/utils')
module.exports = {
  path: resolve('dll'),
  context: resolveSrc(),
  groups: {
    cacheGroups: [
      {
        entries: [resolveSrc('lib/dll')],
        name: 'dll',
      }
    ],
    webpackCfg: {
      mode: 'none'
    }
  }
}
