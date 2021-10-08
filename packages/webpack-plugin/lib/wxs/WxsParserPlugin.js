class WxsParserPlugin {
  constructor (options) {
    this.options = options
  }

  apply (parser) {
    parser.hooks.program.tap({
      name: 'WxsParserPlugin',
      // 放在最后面执行
      stage: 100
    }, ast => {
      const module = parser.state.module
      if (module.buildInfo) {
        module.buildInfo.strict = false
      }
    })
  }
}

module.exports = WxsParserPlugin
