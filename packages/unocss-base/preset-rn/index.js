import rules, { blocklistRules } from './rules/index.js'
import { normalizeTransfromVar } from './rules/transforms.js'
import theme from './theme.js'
import blocklistVariants from './variants/index.js'
import { transformBase } from '@unocss/preset-mini/rules'
import { filterBase } from '@unocss/preset-wind/rules'

function normalizePreflightBase (preflightBase) {
  normalizeTransfromVar(preflightBase)
  return preflightBase
}

function preflights () {
  return [
    {
      layer: 'preflights',
      getCSS ({ theme, generator }) {
        generator._mpx2rnUnoPreflightBase = [
          ...normalizePreflightBase(transformBase),
          ...filterBase
        ]
      }
    }
  ]
}

function postprocess (utilsObject) {
  const everyIsVar = utilsObject.entries.every(v => {
    return v[0].startsWith('--un')
  })
  if (everyIsVar) {
    utilsObject.layer = 'varUtilities'
  }
  return utilsObject
}

export default function presetRnMpx () {
  return {
    name: '@mpxjs/unocss-preset-rn',
    rules,
    theme,
    preflights: preflights(),
    postprocess: [postprocess],
    blocklist: [
      ...blocklistRules,
      ...blocklistVariants
    ]
  }
}
