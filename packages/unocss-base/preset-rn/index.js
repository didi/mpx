import rules, { blocklistRules } from './rules/index.js'
import theme from './theme.js'
import blocklistVariants from './variants/index.js'

export default function presetRnMpx () {
  return {
    name: '@mpxjs/unocss-preset-rn',
    rules,
    theme,
    blocklist: [
      ...blocklistRules,
      ...blocklistVariants
    ]
  }
}
