const postcss = require('postcss')
const pxRegExp = /\b(\d+(\.\d+)?)px\b/
const pxRegExpG = /\b(\d+(\.\d+)?)px\b/g

module.exports = postcss.plugin('rpx', (options = {}) => root => {
  const mode = options.mode || 'only'
  const mpxMode = options.mpxMode
  const defaultIgnoreComment = mode === 'all' ? 'use px' : 'use rpx'
  const baseWidth = 750
  const designWidth = options.designWidth || 750
  const ratio = +(baseWidth / designWidth).toFixed(2)
  const vwRatio = +(designWidth / 100).toFixed(2)
  function isIgnoreComment (node) {
    let result = node && node.type === 'comment' && node.text.trim() === (options.comment || defaultIgnoreComment)
    if (result) {
      node.remove()
    }
    return result
  }

  function transRpx (declaration) {
    if (pxRegExp.test(declaration.value)) {

      declaration.value = declaration.value.replace(pxRegExpG, function (match, $1) {
        if ($1 === '0') return $1
        if (mpxMode === 'web') {
          return `${$1 / vwRatio}vw`
        } else {
          return `${$1 * ratio}rpx`
        }

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
})
