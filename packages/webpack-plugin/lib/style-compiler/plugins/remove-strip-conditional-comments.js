const { STYLE_PAD_PLACEHOLDER } = require('../../utils/const')

module.exports = () => {
  return {
    postcssPlugin: 'remove-strip-conditional-comments',
    Comment (comment) {
      if (comment.text.trim() === STYLE_PAD_PLACEHOLDER) {
        comment.remove()
      }
    }
  }
}

module.exports.postcss = true
