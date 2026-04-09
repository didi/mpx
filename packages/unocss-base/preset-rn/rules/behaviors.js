import { imageRenderings, overscrolls, listStyle, accents, carets } from '@unocss/preset-wind3/rules'
import { appearance, willChange } from '@unocss/preset-mini/rules'

export const blockBehaviors = [
  ...overscrolls,
  ...imageRenderings,
  ...listStyle,
  ...willChange,
  ...appearance,
  ...accents,
  ...carets
]
