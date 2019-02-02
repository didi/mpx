class WxsParserPlugin {
  constructor (options) {
    this.options = options
  }

  apply (parser, compilation) {
    // 处理swan中filter的export
    if (this.options.mode === 'swan') {
      if (!compilation.__swan_exports_map__) {
        compilation.__swan_exports_map__ = {}
      }
      const isEntryModule = () => {
        const module = parser.state.module
        return compilation.entries.indexOf(module) > -1
      }
      parser.hooks.export.tap({
        name: 'WxsParserPlugin',
        // 放在最前面执行
        stage: -100
      }, (statement) => {
        if (isEntryModule()) {
          if (statement.type === 'ExportDefaultDeclaration') {
            if (statement.declaration.type === 'ObjectExpression') {
              statement.declaration.properties.forEach((property) => {
                if (property.type === 'Property' && property.value.type === 'FunctionExpression') {
                  compilation.__swan_exports_map__[property.key.name] = property.value.params.length
                } else {
                  throw new Error('Swan filter module exports value must be a FunctionExpression!')
                }
              })
            } else {
              throw new Error('Swan filter module exports declaration must be an ObjectExpression!')
            }
          } else {
            throw new Error('Swan filter module exports must be an ExportDefaultDeclaration!')
          }
        }
      })
    }

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
