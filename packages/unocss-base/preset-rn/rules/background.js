import { findRawRules, transformEmptyRule } from '../../utils/index.js'
import { backgroundStyles } from '@unocss/preset-wind/rules'

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

export default [
  ...transformEmptyRule(NewBackgroundRules)
]
