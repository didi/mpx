const { transformEmptyRule, ruleFallback } = require('../../utils/index')
const {
  writingModes,
  writingOrientations,
  hyphens
  // fontVariantNumericBase,
  // fontVariantNumeric
} = require('@unocss/preset-wind/rules')
const {
  textStrokes,
  textIndents,
  tabSizes,
  whitespaces,
  breaks,
  textOverflows,
  textWraps,
  fontSmoothings,
  verticalAligns
} = require('@unocss/preset-mini/rules')

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

module.exports = [
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
    // newFontVariantNumberic,
    newVerticalAlign
  )
]
