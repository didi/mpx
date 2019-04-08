const type = require('../utils/type')

function defaultNormalizeTest (rawTest, context) {
  let testType = type(rawTest)
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
  const { target, testKey, normalizeTest, data, waterfall } = options
  rules = rules.rules || rules
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    const tester = (normalizeTest || defaultNormalizeTest)(rule.test, rule)
    const testInput = testKey ? input[testKey] : input
    const processor = rule[target]
    const meta = {}
    if (tester(testInput, meta) && processor) {
      let result = processor.call(rule, input, data, meta)
      if (waterfall) {
        input = result || input
      } else {
        return result
      }
    }
  }
  if (waterfall) return input
}
