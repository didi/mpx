const { rules } = require('@unocss/preset-wind')
const { findRawRules, transformEmptyRule } = require('../../utils')

const overscrollBehavior = findRawRules(/overscroll-.*/, rules)
const imageRenderings = findRawRules(/image-render-*/, rules)
// todo
// const placeholder = findRawRules('$ placeholder', rules, true)
const staticListStyle = findRawRules(/list-.*/, rules)
const dynamicListStyle = [
  [/^list-(.+?)(?:-(outside|inside))?$/],
  [/^list-image-(.+)$/]
]

module.exports = [
  ...transformEmptyRule(
    overscrollBehavior,
    imageRenderings,
    staticListStyle,
    dynamicListStyle
  )
]
