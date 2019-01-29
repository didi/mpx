const WxsMainTemplatePlugin = require('./WxsMainTemplatePlugin')

class WxsTemplatePlugin {
  constructor (options = {mode:'wx'}) {
    this.options = options
  }

  apply (compiler) {
    compiler.hooks.thisCompilation.tap('WxsTemplatePlugin', compilation => {
      new WxsMainTemplatePlugin(this.options).apply(
        compilation.mainTemplate
      )
    })
  }
}

module.exports = WxsTemplatePlugin
