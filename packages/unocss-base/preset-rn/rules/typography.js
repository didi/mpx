const { transformEmptyRule, findRawRules, ruleFallback } = require('../../utils/index')
const { rules } = require('@unocss/preset-wind')
const {
  textStrokes,
  textIndents,
  tabSizes,
  whitespaces,
  breaks,
  textOverflows,
  textWraps,
  fontSmoothings,
  // fontVariantNumeric,
  // fontVariantNumericBase,
  verticalAligns
} = require('@unocss/preset-mini/rules')

// write-orientation & write-mode
const writingOrientationsAndModes = findRawRules(/^write-?.*/, rules)
// hyphens
const hyphens = findRawRules(/^hyphens-.*/, rules)
// decoration
const textDecorations = [
  // size
  [/^(?:underline|decoration)-(?:size-)?(.+)$/], // todo size 会命中其他的规则
  [/^(?:underline|decoration)-(auto|from-font)$/],
  // offset
  [/^(?:underline|decoration)-offset-(.+)$/]
]

// font-variant-numberic
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
    writingOrientationsAndModes,
    textDecorations,
    textWraps,
    fontSmoothings,
    // newFontVariantNumberic,
    newVerticalAlign
  )
]
