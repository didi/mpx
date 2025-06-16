import { imageRenderings, overscrolls, listStyle, accents, carets } from '@unocss/preset-wind3/rules'
import { appearance, outline, willChange } from '@unocss/preset-mini/rules'

export default [
  ...overscrolls,
  ...imageRenderings,
  ...listStyle,
  ...outline,
  ...willChange,
  ...appearance,
  ...accents,
  ...carets
]
