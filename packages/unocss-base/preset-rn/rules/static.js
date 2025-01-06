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
import { backgroundBlendModes, mixBlendModes, hyphens, isolations, objectPositions } from '@unocss/preset-wind/rules'

const displays = [
  'inline',
  'block',
  'inline-block',
  'contents',
  'flow-root',
  'list-item'
]

const appearances = ['visible', 'invisible']

const textOverflows = ['text-ellipsis', 'text-clip']

const fontStyles = ['oblique', 'font-oblique']

export default [
  ...appearances,
  ...breaks,
  ...contains,
  ...contents,
  ...contentVisibility,
  ...cursors,
  ...displays,
  ...fontSmoothings,
  ...fontStyles,
  ...resizes,
  ...textOverflows,
  ...textWraps,
  ...whitespaces,
  ...backgroundBlendModes,
  ...mixBlendModes,
  ...hyphens,
  ...isolations,
  ...objectPositions
]
