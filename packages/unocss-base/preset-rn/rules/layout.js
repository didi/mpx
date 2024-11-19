const { ruleCallback, ruleFallback } = require('../../utils')

const overflows = [
  [/^(?:overflow|of)-(.+)$/, ([match, v], { generator }) => {
    if (['hidden', 'visiable', 'scroll'].includes(v)) {
      return {
        overflow: v
      }
    } else {
      return ruleFallback(match, generator)
    }
  }],
  [/^(?:overflow|of)-([xy])-(.+)$/, ruleCallback]
]

module.exports = [
  ...overflows
]
