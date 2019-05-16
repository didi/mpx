const compiler = require('./compiler')
const loaderUtils = require('loader-utils')
const bindThis = require('./bind-this').transform
const InjectDependency = require('../dependency/InjectDependency')
const stripExtension = require('../utils/strip-extention')
const getMainCompilation = require('../utils/get-main-compilation')

module.exports = function (raw) {
  this.cacheable()
  const options = loaderUtils.getOptions(this) || {}

  const isNative = options.isNative
  const compilation = this._compilation
  const mainCompilation = getMainCompilation(compilation)
  const mode = mainCompilation.__mpx__.mode
  const globalSrcMode = mainCompilation.__mpx__.srcMode
  const localSrcMode = loaderUtils.parseQuery(this.resourceQuery || '?').mode
  const componentsMap = mainCompilation.__mpx__.componentsMap
  const wxsContentMap = mainCompilation.__mpx__.wxsConentMap
  const resource = stripExtension(this.resource)

  let parsed = compiler.parse(raw, Object.assign(options, {
    warn: (msg) => {
      this.emitWarning(
        new Error('[template compiler][' + this.resource + ']: ' + msg)
      )
    },
    error: (msg) => {
      this.emitError(
        new Error('[template compiler][' + this.resource + ']: ' + msg)
      )
    },
    resource: this.resource,
    isComponent: !!componentsMap[resource],
    mode,
    srcMode: localSrcMode || globalSrcMode,
    isNative
  }))

  let ast = parsed.root
  let meta = parsed.meta

  if (meta.wxsConentMap) {
    for (let module in meta.wxsConentMap) {
      wxsContentMap[`${resource}~${module}`] = meta.wxsConentMap[module]
    }
  }

  let result = compiler.serialize(ast)

  if (isNative) {
    return result
  }

  let renderResult = bindThis(`global.currentInject = {
    moduleId: ${JSON.stringify(options.moduleId)},
    render: function () {
      var __seen = [];
      var renderData = {};
      ${compiler.genNode(ast)}return renderData;
    }
};\n`, {
    needCollect: true,
    ignoreMap: meta.wxsModuleMap
  })

  let globalInjectCode = renderResult.code + '\n'

  if (mode === 'tt' && renderResult.propKeys) {
    globalInjectCode += `global.currentInject.propKeys = ${JSON.stringify(renderResult.propKeys)};\n`
  }

  if (meta.computed) {
    globalInjectCode += bindThis(`global.currentInject.injectComputed = {
  ${meta.computed.join(',')}
  };`).code + '\n'
  }

  if (meta.refs) {
    globalInjectCode += `global.currentInject.getRefsData = function () {
  return ${JSON.stringify(meta.refs)};
  };\n`
  }

  const issuer = this._module.issuer
  const parser = issuer.parser

  issuer.dependencies = issuer.dependencies.filter((dep) => {
    return !dep.templateInject
  })

  const dep = new InjectDependency({
    content: globalInjectCode,
    index: -2
  })

  dep.templateInject = true

  issuer.addDependency(dep)

  let isSync = true

  const iterationOfArrayCallback = (arr, fn) => {
    for (let index = 0; index < arr.length; index++) {
      fn(arr[index])
    }
  }

  const dependencies = new Map()

  const addDependency = dep => {
    const resourceIdent = dep.getResourceIdentifier()
    if (resourceIdent) {
      const factory = compilation.dependencyFactories.get(dep.constructor)
      if (factory === undefined) {
        throw new Error(`No module factory available for dependency type: ${dep.constructor.name}`)
      }
      let innerMap = dependencies.get(factory)
      if (innerMap === undefined) {
        dependencies.set(factory, (innerMap = new Map()))
      }
      let list = innerMap.get(resourceIdent)
      if (list === undefined) innerMap.set(resourceIdent, (list = []))
      list.push(dep)
    }
  }

  for (let module in meta.wxsModuleMap) {
    isSync = false
    let src = meta.wxsModuleMap[module]
    const expression = `require(${JSON.stringify(src)})`
    const deps = []
    parser.parse(expression, {
      current: {
        addDependency: dep => {
          dep.userRequest = module
          deps.push(dep)
        }
      },
      module: issuer
    })
    issuer.addVariable(module, expression, deps)
    iterationOfArrayCallback(deps, addDependency)
  }

  if (isSync) {
    return result
  } else {
    const callback = this.async()

    const sortedDependencies = []
    for (const pair1 of dependencies) {
      for (const pair2 of pair1[1]) {
        sortedDependencies.push({
          factory: pair1[0],
          dependencies: pair2[1]
        })
      }
    }

    compilation.addModuleDependencies(
      issuer,
      sortedDependencies,
      compilation.bail,
      null,
      true,
      () => {
        callback(null, result)
      }
    )
  }
}
