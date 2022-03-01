const postcss = require('postcss')
const rpxRegExp = /\b(\d+(\.\d+)?)rpx\b/
const rpxRegExpG = /\b(\d+(\.\d+)?)rpx\b/g

module.exports = postcss.plugin('hm', (options = {}) => root => {
  function transHm (declaration) {
    if (rpxRegExp.test(declaration.value)) {
      declaration.value = declaration.value.replace(rpxRegExpG, function (match, $1) {
        if ($1 === '0') return $1
        return `${$1}hm`
      })
    }
  }

  root.walkRules(rule => {
    rule.walkDecls(declaration => {
      transHm(declaration)
    })
  })
})
