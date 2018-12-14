const WxsMainTemplatePlugin = require('./WxsMainTemplatePlugin')

class WxsTemplatePlugin {
  constructor (options) {
    options = options || {}
  }

  apply (compiler) {
    compiler.hooks.thisCompilation.tap('WxsTemplatePlugin', compilation => {
      new WxsMainTemplatePlugin().apply(
        compilation.mainTemplate
      )
    })
  }
}

module.exports = WxsTemplatePlugin
