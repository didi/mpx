const { findRawRules, transformEmptyRule } = require('../../utils/index')
const { backgroundStyles } = require('@unocss/preset-wind/rules')

// todo background-position 剔除
const NewBackgroundRules = findRawRules([
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
], backgroundStyles)

module.exports = [
  ...transformEmptyRule(NewBackgroundRules)
]
