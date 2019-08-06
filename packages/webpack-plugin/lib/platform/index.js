const runRules = require('./run-rules')

module.exports = function getRulesRunner ({ type, mode, srcMode, testKey, mainKey, waterfall, warn, error }) {
  const finalNotify = {
    warnArray: [],
    errorArray: []
  }

  const _warn = (content) => {
    finalNotify.warnArray.push(content)
  }
  const _error = (content) => {
    finalNotify.errorArray.push(content)
  }

  const specMap = {
    template: {
      wx: require('./template/wx')({ warn: _warn, error: _error })
    },
    json: {
      wx: require('./json/wx')({ warn, error })
    }
  }
  const spec = specMap[type] && specMap[type][srcMode]

  if (spec && spec.supportedTargets.indexOf(mode) > -1) {
    const normalizeTest = spec.normalizeTest
    const mainRules = mainKey ? spec[mainKey] : spec
    if (mainRules) {
      return function (input) {
        runRules(mainRules, input, { target: mode, testKey, waterfall, normalizeTest })
        finalNotify.key = mode + (input && input.tag)
        return finalNotify
      }
    }
  }
}
