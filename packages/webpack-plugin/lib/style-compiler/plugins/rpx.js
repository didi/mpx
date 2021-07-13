const postcss = require('postcss')
const pxRegExp = /\b(\d+(\.\d+)?)px\b/
const pxRegExpG = /\b(\d+(\.\d+)?)px\b/g
const rpxRegExp = /\b(\d+(\.\d+)?)rpx\b/
const rpxRegExpG = /\b(\d+(\.\d+)?)rpx\b/g

module.exports = postcss.plugin('rpx', (options = {}) => root => {
  const mode = options.mode || 'only'
  const mpxMode = options.mpxMode
  const defaultIgnoreComment = mode === 'all' ? 'use px' : 'use rpx'
  const baseWidth = 750
  const designWidth = options.designWidth || 750
  const ratio = +(baseWidth / designWidth).toFixed(2)
  const px2vwRatio = +(designWidth / 100).toFixed(2)
  const rpx2vwRatio = +(100 / designWidth).toFixed(8)
  function isIgnoreComment (node) {
    let result = node && node.type === 'comment' && node.text.trim() === (options.comment || defaultIgnoreComment)
    if (result) {
      node.remove()
    }
    return result
  }

  function transRpx (declaration) {
    let unit
    let regExp
    if (rpxRegExp.test(declaration.value)) {
      regExp = rpxRegExpG
      unit = 'rpx'
    } else if (pxRegExp.test(declaration.value)) {
      regExp = pxRegExpG
      unit = 'px'
    }
    declaration.value = declaration.value.replace(regExp, function (match, $1) {
      return handleCalc($1, unit)
    })
  }

  function handleCalc (value, unit) {
    if (value === '0') return value
    switch (unit) {
      case 'rpx':
        if (mpxMode === 'web') {
          return `${value * rpx2vwRatio}vw`
        }
        break
      case 'px':
        if (mpxMode === 'web') {
          return `${value / px2vwRatio}vw`
        } else {
          return `${value * ratio}rpx`
        }
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
