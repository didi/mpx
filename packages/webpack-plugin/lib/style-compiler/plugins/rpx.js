const postcss = require('postcss')
const pxRegExp = /\b(\d+(\.\d+)?)px\b/
const pxRegExpG = /\b(\d+(\.\d+)?)px\b/g
const rpxRegExp = /\b(\d+(\.\d+)?)rpx\b/
const rpxRegExpG = /\b(\d+(\.\d+)?)rpx\b/g

module.exports = postcss.plugin('rpx', (options = {}) => root => {
  const mode = options.mode || 'only'
  const defaultIgnoreComment = mode === 'all' ? 'use px' : 'use rpx'
  const baseWidth = 750
  const designWidth = options.designWidth || 750
  const ratio = +(baseWidth / designWidth).toFixed(2)

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
        if (mode === 'web')
          return `${$1 * ratio/7.5}vw`
        return `${$1 * ratio}rpx`
      })
    }
    if (rpxRegExp.test(declaration.value) && mode === 'web') {
      declaration.value = declaration.value.replace(rpxRegExpG, function (match, $1) {
        return `${$1 * ratio/7.5}vw`
      })
    }
  }

  root.walkRules(rule => {
    let ignore = false
    if (isIgnoreComment(rule.prev())) {
      ignore = true
    }
    rule.walkDecls(declaration => {
      if (ignore || isIgnoreComment(declaration.prev())) {
        if (mode === 'only' || mode === 'web') {
          transRpx(declaration)
        }
      } else {
        if (mode === 'all' || mode === 'web') {
          transRpx(declaration)
        }
      }
    })
  })
})
