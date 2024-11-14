const { genEmptyRule } = require('../../utils/index')

module.exports = {
  ...genEmptyRule(
    'bg-origin-border',
    'bg-origin-padding',
    'bg-origin-content'
    // global rules: bg-origin-inherit
  )
}
