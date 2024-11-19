const { findRawRules, transformEmptyRule } = require('../../utils/index')
const { rules } = require('@unocss/preset-wind')

// todo background-position 剔除
const backgroundRules = findRawRules([
  // attachments
  'bg-fixed',
  'bg-locale',
  'bg-scroll',
  // repeat
  /^bg-repeat-?.*/,
  // origins
  /^bg-origin-.*/,
  // clips
  /^bg-clip-.*/
], rules)

module.exports = [
  ...transformEmptyRule(backgroundRules)
]
