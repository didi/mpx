const postcss = require('postcss')
const pxRegExp = /\b(\d+(\.\d+)?)px\b/
const pxRegExpG = /\b(\d+(\.\d+)?)px\b/g

module.exports = postcss.plugin('rpx', (options = {}) => root => {
  let defaultIgnoreComment = options.mode === 'all' ? 'use px' : 'use rpx'

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
        return `${$1}rpx`
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
        if (options.mode === 'only') {
          transRpx(declaration)
        }
      } else {
        if (options.mode === 'all') {
          transRpx(declaration)
        }
      }
    })
  })
})
