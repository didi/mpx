import rules, { blocklistRules } from './rules/index.js'
import { normalizeTransfromVar } from './rules/transforms.js'
import theme from './theme.js'
import blocklistVariants from './variants/index.js'

function normalizePreflightBase (preflightBase) {
  normalizeTransfromVar(preflightBase)
  return preflightBase
}

function preflights () {
  return [
    {
      layer: 'preflights',
      getCSS ({ theme, generator }) {
        if (theme.preflightBase) {
          generator._mpx2rnUnoPreflightBase = normalizePreflightBase(theme.preflightBase)
        }
      }
    }
  ]
}

export default function presetRnMpx () {
  return {
    name: '@mpxjs/unocss-preset-rn',
    rules,
    theme,
    preflights: preflights(),
    blocklist: [
      ...blocklistRules,
      ...blocklistVariants
    ]
  }
}
