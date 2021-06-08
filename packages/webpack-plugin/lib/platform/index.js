const runRules = require('./run-rules')

module.exports = function getRulesRunner ({ type, mode, srcMode, data, meta, testKey, mainKey, waterfall, warn, error }) {
  const specMap = {
    template: {
      wx: require('./template/wx')({ warn, error })
    },
    json: {
      wx: require('./json/wx')({ warn, error })
    }
  }
  const spec = specMap[type] && specMap[type][srcMode]
  if (spec && spec.supportedModes.indexOf(mode) > -1) {
    const normalizeTest = spec.normalizeTest
    const mainRules = mainKey ? spec[mainKey] : spec
    if (mainRules) {
      return function (input, options) {
        return runRules(mainRules, input, Object.assign({
          mode,
          data,
          meta,
          testKey,
          waterfall,
          normalizeTest
        }, options))
      }
    }
  }
}
