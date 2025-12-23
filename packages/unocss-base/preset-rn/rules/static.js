import {
  breaks,
  contains,
  contents,
  contentVisibility,
  cursors,
  fontSmoothings,
  resizes,
  textWraps,
  whitespaces
} from '@unocss/preset-mini/rules'
import { backgroundBlendModes, mixBlendModes, hyphens, isolations, objectPositions } from '@unocss/preset-wind3/rules'

const blockDisplays = [
  'inline',
  'block',
  'inline-block',
  'contents',
  'flow-root',
  'list-item'
]

const blockAppearances = ['visible', 'invisible']

const blockTextOverflows = ['text-ellipsis', 'text-clip']

const blockFontStyles = ['oblique', 'font-oblique']

const blockStatics = [
  ...blockAppearances,
  ...breaks,
  ...contains,
  ...contents,
  ...contentVisibility,
  ...cursors,
  ...blockDisplays,
  ...fontSmoothings,
  ...blockFontStyles,
  ...resizes,
  ...blockTextOverflows,
  ...textWraps,
  ...whitespaces,
  ...backgroundBlendModes,
  ...mixBlendModes,
  ...hyphens,
  ...isolations,
  ...objectPositions
]

export { blockStatics }
