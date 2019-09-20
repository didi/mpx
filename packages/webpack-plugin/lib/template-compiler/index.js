const compiler = require('./compiler')
const loaderUtils = require('loader-utils')
const bindThis = require('./bind-this').transform
const InjectDependency = require('../dependency/InjectDependency')
const getResourcePath = require('../utils/get-resource-path')
const getMainCompilation = require('../utils/get-main-compilation')
const path = require('path')

module.exports = function (raw) {
  this.cacheable()
  const options = loaderUtils.getOptions(this) || {}
  const isNative = options.isNative
  const compilation = this._compilation
  const mainCompilation = getMainCompilation(compilation)
  const mpx = mainCompilation.__mpx__
  const mode = mpx.mode
  const externalClasses = mpx.externalClasses
  const globalSrcMode = mpx.srcMode
  const localSrcMode = loaderUtils.parseQuery(this.resourceQuery || '?').mode
  const packageName = mpx.processingSubPackageRoot || 'main'
  const componentsMap = mpx.componentsMap[packageName]
  const wxsContentMap = mpx.wxsConentMap
  const resourcePath = getResourcePath(this.resource)
  let scopedId

  if (options.hasScoped) {
    scopedId = options.moduleId
  }

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
    basename: path.basename(this.resource),
    isComponent: !!componentsMap[resourcePath],
    mode,
    externalClasses,
    srcMode: localSrcMode || globalSrcMode,
    isNative,
    scopedId
  }))

  let ast = parsed.root
  let meta = parsed.meta

  if (meta.wxsConentMap) {
    for (let module in meta.wxsConentMap) {
      wxsContentMap[`${resourcePath}~${module}`] = meta.wxsConentMap[module]
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

  if ((mode === 'tt' || mode === 'swan') && renderResult.propKeys) {
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

  // 同步issuer的dependencies，确保watch中issuer rebuild时template也进行rebuild，使该loader中往issuer中注入的依赖持续有效
  issuer.buildInfo.fileDependencies.forEach((dep) => {
    this.addDependency(dep)
  })
  issuer.buildInfo.contextDependencies.forEach((dep) => {
    this.addContextDependency(dep)
  })

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
