const { imageRenderings, overscrolls, listStyle } = require('@unocss/preset-wind/rules')
const { transformEmptyRule } = require('../../utils')

// todo
// const placeholder = findRawRules('$ placeholder', rules, true)

module.exports = [
  ...transformEmptyRule(
    overscrolls,
    imageRenderings,
    listStyle
  )
]
