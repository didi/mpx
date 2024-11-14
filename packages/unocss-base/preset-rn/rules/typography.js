const { transformEmptyRule } = require('../../utils/index')
const {
  textStrokes,
  textIndents,
  tabSizes,
  whitespaces
} = require('@unocss/preset-mini/rules')

module.exports = [
  ...transformEmptyRule(textIndents, textStrokes, tabSizes, whitespaces)
]
