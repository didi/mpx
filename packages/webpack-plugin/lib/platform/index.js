const runRules = require('./run-rules')

module.exports = function getRulesRunner ({
  type,
  mode,
  srcMode,
  data,
  meta,
  testKey,
  mainKey,
  waterfall,
  moduleId,
  warn,
  error
}) {
  const specMap = {
    template: {
      wx: require('./template/wx')
    },
    style: {
      wx: require('./style/wx')
    },
    json: {
      wx: require('./json/wx')
    }
  }
  const spec = specMap[type] && specMap[type][srcMode] && specMap[type][srcMode]({ warn, error, moduleId })
  if (spec && spec.supportedModes.indexOf(mode) > -1) {
    const normalizeTest = spec.normalizeTest
    const mainRules = mainKey ? spec[mainKey] : spec
    if (mainRules) {
      return function (input) {
        const a = runRules(mainRules, input, { mode, data, meta, testKey, waterfall, normalizeTest })
        return a
      }
    }
  }
}
