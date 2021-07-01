const css = require('css')
const pxRegExp = /\b(\d+(\.\d+)?)px\b/
const loaderUtils = require('loader-utils')

class VwLoader {
  constructor (options) {
    this.defaultConfig = {
      vwRatio: 7.5,
      precision: 2,
      mode: 'vw',
      comment: 'use px'
    }
    this.config = Object.assign({}, this.defaultConfig, options)
  }
  processRules (rules) {
    const config = this.config || {}
    const mode = config.mode || 'vw'
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i]
      if (rule.type === 'media') {
        this.processRules(rule.rules)
        continue
      } else if (rule.type === 'keyframes') {
        this.processRules(rule.keyframes)
        continue
      } else if (rule.type !== 'rule' && rule.type !== 'keyframe') {
        continue
      }
      const declarations = rule.declarations || []
      for (let j = 0; j < declarations.length; j++) {
        const declaration = declarations[j]
        if (declaration.type === 'declaration' && pxRegExp.test(declaration.value)) {
          const nextDeclaration = rule.declarations[j + 1]
          if (nextDeclaration && nextDeclaration.type === 'comment') {
            if (nextDeclaration.comment.trim() === config.comment) {
              declarations.splice(j + 1, 1)
            }
          } else {
            declaration.value = this.handleCalc(mode, declaration.value)
          }
        }
      }
    }
  }
  handleCalc (mode, value) {
    const designWidth = this.config.designWidth || 750
    const originPx = new RegExp(pxRegExp.source, 'g')
    const ratio = designWidth / 100 || this.config.vwRatio
    return value.replace(originPx, ($0, $1) => {
      return this.getValue($1 / ratio, mode)
    })
  }
  getValue (val, mode) {
    val = parseFloat(val.toFixed(this.config.precision))
    return val === 0 ? val : val + mode
  }
  transformvW (cssText) {
    const astContent = cssText && css.parse(cssText)
    this.processRules(astContent.stylesheet.rules)
    return css.stringify(astContent)
  }
}
module.exports = function (source) {
  var options = loaderUtils.getOptions(this)
  var loader = new VwLoader(options)
  return loader.transformvW(source)
}
