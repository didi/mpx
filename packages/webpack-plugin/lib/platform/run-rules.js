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
  const { mode, testKey, normalizeTest, data = {}, meta = {}, waterfall, diagnostic } = options
  rules = rules.rules || rules
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]
    const tester = (normalizeTest || defaultNormalizeTest)(rule.test, rule)
    const testInput = testKey ? input[testKey] : input
    const processor = rule[mode]
    // mode 和 diagnostic 传入 data 中供 processor 内部使用
    Object.assign(data, {
      mode,
      diagnostic
    })
    if (tester(testInput, meta, data) && processor) {
      const runProcessor = () => processor.call(rule, input, data, meta)
      const result = diagnostic && diagnostic.withContext
        ? diagnostic.withContext({ mode, rule, input, data, meta, testKey, testInput }, runProcessor)
        : runProcessor()
      meta.processed = true
      if (result !== undefined) {
        input = result
      }
      if (!(rule.waterfall || waterfall)) break
    }
  }
  return input
}
