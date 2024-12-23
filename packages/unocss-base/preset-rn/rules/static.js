import { backgroundBlendModes, mixBlendModes } from '@unocss/preset-wind/rules'
import { transformEmptyRule } from '../../utils/index.js'

export default transformEmptyRule(
  backgroundBlendModes,
  mixBlendModes
)
