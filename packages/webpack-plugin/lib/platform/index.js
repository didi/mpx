const runRules = require('./run-rules')
const specMap = {
  template: {
    wx: require('./template/wx')
  },
  json: {
    wx: require('./json/wx')
  }
}

module.exports = function getRulesRunner ({
  type,
  mode,
  srcMode,
  data,
  meta,
  testKey,
  mainKey,
  waterfall,
  warn,
  error
}) {
  const spec = specMap[type] && specMap[type][srcMode] && specMap[type][srcMode]({ warn, error })
  if (spec && spec.supportedModes.indexOf(mode) > -1) {
    const normalizeTest = spec.normalizeTest
    const mainRules = mainKey ? spec[mainKey] : spec
    if (mainRules) {
      return function (input) {
        return runRules(mainRules, input, { mode, data, meta, testKey, waterfall, normalizeTest })
      }
    }
  }
}
