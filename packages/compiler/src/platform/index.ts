import runRules from './run-rules'
import wxTemplate from './template/wx'
import wxJson from './json/wx'

export default function getRulesRunner ({ type, mode, srcMode, data, meta, testKey, mainKey, waterfall, warn, error }) {
  const specMap = {
    template: {
      wx: wxTemplate({ warn, error })
    },
    json: {
      wx: wxJson({ warn, error })
    }
  }
  const spec = specMap[type] && specMap[type][srcMode]
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
