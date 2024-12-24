import { transformEmptyRule, ruleFallback } from '../../utils/index.js'
import {
  writingModes,
  writingOrientations,
  hyphens,
  fontVariantNumeric
} from '@unocss/preset-wind/rules'
import {
  textStrokes,
  textIndents,
  tabSizes,
  whitespaces,
  breaks,
  textOverflows,
  textWraps,
  fontSmoothings,
  verticalAligns
} from '@unocss/preset-mini/rules'

// decoration
const textDecorations = [
  // size
  [/^(?:underline|decoration)-(?:size-)?(.+)$/], // todo size 会命中其他的规则
  [/^(?:underline|decoration)-(auto|from-font)$/],
  // offset
  [/^(?:underline|decoration)-offset-(.+)$/]
]

// vertical-align
const newVerticalAlign = verticalAligns.map(item => {
  return [item[0], ([match, v], { generator }) => {
    if (['auto', 'top', 'bottom', 'center'].includes(v)) {
      return { 'vertical-align': v }
    } else {
      return ruleFallback(match, generator)
    }
  }]
})

export default [
  ...transformEmptyRule(
    textIndents,
    textStrokes,
    tabSizes,
    whitespaces,
    breaks,
    textOverflows,
    hyphens,
    writingModes,
    writingOrientations,
    textDecorations,
    textWraps,
    fontSmoothings,
    fontVariantNumeric,
    newVerticalAlign
  )
]
