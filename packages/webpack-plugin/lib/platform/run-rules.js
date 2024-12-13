const type = require('../utils/type')

function defaultNormalizeTest (rawTest, context) {
  const testType = type(rawTest)
  switch (testType) {
    case 'Function':
      return rawTest.bind(context)
    case 'RegExp':
      return input => rawTest.test(input)
    case 'String':
      return input => rawTest === input
    default:
      return () => true
  }
}

module.exports = function runRules (rules = [], input, options = {}) {
  const { mode, testKey, normalizeTest, data = {}, meta = {}, waterfall } = options
  rules = rules.rules || rules
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    const tester = (normalizeTest || defaultNormalizeTest)(rule.test, rule)
    const testInput = testKey ? input[testKey] : input
    const processor = rule[mode]
    // mode传入data中供processor使用
    Object.assign(data, {
      mode
    })
    if (tester(testInput, meta) && processor) {
      const result = processor.call(rule, input, data, meta)
      meta.processed = true
      if (result !== undefined) {
        input = result
      }
      if (!(rule.waterfall || waterfall)) break
    }
  }
  return input
}
