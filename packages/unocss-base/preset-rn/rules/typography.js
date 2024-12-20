import { transformEmptyRule } from '../../utils/index.js'
import {
  writingModes,
  writingOrientations,
  hyphens
  // fontVariantNumericBase,
  // fontVariantNumeric
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

// todo 覆写 font-variant-numberic，和 RN 支持的属性拉齐
// const newFontVariantNumberic = fontVariantNumeric.map(item => {
//   const rule = item[0]
//   const rawResult = item[1]()
//   if (rule === 'normal-nums') {
//     return item
//   } else {
//     return [rule, {
//       ...fontVariantNumericBase,
//       ...rawResult
//     }]
//   }
// })

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
    fontSmoothings
    // newFontVariantNumberic,
  )
]
