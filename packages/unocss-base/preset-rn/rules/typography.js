import { transformEmptyRule } from '../../utils/index.js'
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
  fontSmoothings
} from '@unocss/preset-mini/rules'

// decoration
const textDecorations = [
  // size
  [/^(?:underline|decoration)-(?:size-)?(.+)$/], // todo size 会命中其他的规则
  [/^(?:underline|decoration)-(auto|from-font)$/],
  // offset
  [/^(?:underline|decoration)-offset-(.+)$/]
]

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
    fontVariantNumeric
  )
]
