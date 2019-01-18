const compiler = require('./compiler')
const loaderUtils = require('loader-utils')
const bindThis = require('./bind-this').transform
const InjectDependency = require('../dependency/InjectDependency')

module.exports = function (raw) {
  this.cacheable()
  const mode = this._compilation.__mpx__.mode
  const options = loaderUtils.getOptions(this) || {}
  let parsed = compiler.parse(raw, Object.assign(options, {
    warn: (msg) => {
      this.emitWarning(
        new Error('[template compiler][' + this.resource + ']: ' + msg)
      )
    },
    mode
  }))
  let ast = parsed.root
  let meta = parsed.meta
  if (mode === 'wx') {
    let renderResult = bindThis(`global.currentInject = {
    moduleId: ${JSON.stringify(options.moduleId)},
    render: function () {
      var __seen = [];
      var renderData = {};
      ${compiler.genNode(ast)}
      return this.__processRenderData(renderData)
    }
};\n`, {
      needCollect: true,
      ignoreMap: meta.wxsModuleMap
    })

    let globalInjectCode = renderResult.code + '\n'

    if (meta.computed) {
      globalInjectCode += bindThis(`global.currentInject.injectComputed = {
  ${meta.computed.join(',')}
  };`).code + '\n'
    }

    const dep = new InjectDependency({
      content: globalInjectCode,
      index: -2
    })
    this._module.issuer.addDependency(dep)
  }
  return compiler.serialize(ast)
}
