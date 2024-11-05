const pxRegExp = /\b(-?\d+(\.\d+)?)px\b/
const pxRegExpG = /\b(-?\d+(\.\d+)?)px\b/g
// rpx
module.exports = (options = {}) => {
  return {
    postcssPlugin: 'rpx',
    Once (root) {
      const mode = options.mode || 'only'
      const defaultIgnoreComment = mode === 'all' ? 'use px' : 'use rpx'
      const baseWidth = 750
      const designWidth = options.designWidth || 750
      const ratio = +(baseWidth / designWidth).toFixed(2)
      function isIgnoreComment (node) {
        const result = node && node.type === 'comment' && node.text.trim() === (options.comment || defaultIgnoreComment)
        if (result) {
          node.remove()
        }
        return result
      }

      function transRpx (declaration) {
        if (pxRegExp.test(declaration.value)) {
          declaration.value = declaration.value.replace(pxRegExpG, function (match, $1) {
            if ($1 === '0') return $1
            return `${$1 * ratio}rpx`
          })
        }
      }

      root.walkRules(rule => {
        let ignore = false
        if (isIgnoreComment(rule.prev()) || isIgnoreComment(rule.last)) {
          ignore = true
        }
        rule.walkDecls(declaration => {
          if (ignore || isIgnoreComment(declaration.prev())) {
            if (mode === 'only') {
              transRpx(declaration)
            }
          } else {
            if (mode === 'all') {
              transRpx(declaration)
            }
          }
        })
      })
    }
  }
}

module.exports.postcss = true
