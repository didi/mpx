const WxsTemplatePlugin = require('./WxsTemplatePlugin')
const WxsParserPlugin = require('./WxsParserPlugin')

class WxsPlugin {
  constructor (options = { mode: 'wx' }) {
    this.options = options
  }

  apply (compiler) {
    compiler.hooks.thisCompilation.tap('WxsPlugin', (compilation, { normalModuleFactory }) => {
      new WxsTemplatePlugin(this.options).apply(
        compilation.mainTemplate,
        compilation
      )

      compilation.hooks.buildModule.tap('WxsPlugin', (module) => {
        module.wxs = true
      })

      const handler = (parser) => {
        new WxsParserPlugin(this.options).apply(
          parser,
          compilation
        )
      }

      normalModuleFactory.hooks.parser
        .for('javascript/auto')
        .tap('SwanExportsParserPlugin', handler)
    })
  }
}

module.exports = WxsPlugin
