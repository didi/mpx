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
      console.error(('[template compiler][' + this.resource + ']: ' + msg))
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
      ${compiler.genNode(ast)}
    }
};\n`, {
      needTravel: false,
      needKeyPath: true,
      ignoreMap: meta.wxsModuleMap
    })

    let globalInjectCode = renderResult.code + '\n'

    if (renderResult.keyPathArr.length) {
      let renderData = `{${renderResult.keyPathArr.map((keyPath) => {
        return `${JSON.stringify(keyPath)}: this.${keyPath}`
      }).join(', ')}}`
      globalInjectCode += `global.currentInject.getRenderData = function () { 
  return ${renderData}; 
};\n`
    }

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
