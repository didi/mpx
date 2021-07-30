const postcss = require('postcss')
const rpxRegExp = /\b(\d+(\.\d+)?)rpx\b/
const rpxRegExpG = /\b(\d+(\.\d+)?)rpx\b/g

module.exports = postcss.plugin('vw', (options = {}) => root => {
  const designWidth = options.designWidth || 750
  const rpx2vwRatio = +(100 / designWidth).toFixed(8)

  function transVw (declaration) {
    if (rpxRegExp.test(declaration.value)) {
      declaration.value = declaration.value.replace(rpxRegExpG, function (match, $1) {
        if ($1 === '0') return $1
        return `${$1 * rpx2vwRatio}vw`
      })
    }
  }

  root.walkRules(rule => {
    rule.walkDecls(declaration => {
      transVw(declaration)
    })
  })
})
