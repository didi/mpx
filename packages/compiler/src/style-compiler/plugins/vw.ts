import { Declaration, Plugin } from 'postcss'

const rpxRegExp = /\b(\d+(\.\d+)?)rpx\b/
const rpxRegExpG = /\b(\d+(\.\d+)?)rpx\b/g

export default (options: {
  transRpxFn?: any
} = {}) => {
  return <Plugin>{
    postcssPlugin: 'vw',
    Once: (root) => {
      const rpx2vwRatio = +(100 / 750).toFixed(8)

      const transRpxFn = options.transRpxFn && typeof options.transRpxFn === 'function'
        ? options.transRpxFn
        : function (match: any, $1: any) {
          if ($1 === '0') return $1
          return `${$1 * rpx2vwRatio}vw`
        }
      function transVw (declaration: Declaration) {
        if (rpxRegExp.test(declaration.value)) {
          declaration.value = declaration.value.replace(rpxRegExpG, transRpxFn)
        }
      }

      root.walkRules(rule => {
        rule.walkDecls(declaration => {
          transVw(declaration)
        })
      })
    }
  }
}

module.exports.postcss = true
