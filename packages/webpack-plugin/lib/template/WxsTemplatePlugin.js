const WxsMainTemplatePlugin = require('./WxsMainTemplatePlugin')

class WxsTemplatePlugin {
  apply (compiler) {
    compiler.hooks.thisCompilation.tap('WxsTemplatePlugin', compilation => {
      new WxsMainTemplatePlugin().apply(
        compilation.mainTemplate
      )
    })
  }
}

module.exports = WxsTemplatePlugin
