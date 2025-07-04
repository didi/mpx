import {
  writingModes,
  writingOrientations,
  hyphens,
  fontVariantNumeric
} from '@unocss/preset-wind3/rules'
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

const blockTypography =  [
  ...textIndents,
  ...textStrokes,
  ...tabSizes,
  ...whitespaces,
  ...breaks,
  ...textOverflows,
  ...hyphens,
  ...writingModes,
  ...writingOrientations,
  ...textWraps,
  ...fontSmoothings,
  ...fontVariantNumeric
]

export { blockTypography }
