const { backgroundBlendModes } = require('@unocss/preset-wind/rules')
const { transformEmptyRule } = require('../../utils/index')

module.exports = transformEmptyRule(
  backgroundBlendModes
)
