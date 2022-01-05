const path = require('path')
const harmonySpecifierTag = require('webpack/lib/dependencies/HarmonyImportDependencyParserPlugin').harmonySpecifierTag
const NormalModule = require('webpack/lib/NormalModule')
const NormalModuleReplacementPlugin = require('webpack/lib/NormalModuleReplacementPlugin')
const NullFactory = require('webpack/lib/NullFactory')
const MessageServerPlugin = require('./message-server-plugin')
const parseRequest = require('../utils/parse-request')
const RuntimeCodeDependency = require('./dependencies/RuntimeCodeDependency')
const PartialCompileResolveDependency = require('./dependencies/PartialCompileResolveDependency')

const findPathByDirname = (tail) => {
  return path.join(__dirname, tail)
}

const StaticPaths = {
  preJSONLoader: findPathByDirname('./loaders/pre-app-json.js'),
  postJSONLoader: findPathByDirname('./loaders/post-app-json.js'),
  jsonCompiler: findPathByDirname('../json-compiler/index'),
  partialCompileRuntimeEntry: findPathByDirname('./runtime/entry.js'),
  monitorNavigateAPI: findPathByDirname('./runtime/monitor-navigate-api.js'),
  resolvePathLoader: findPathByDirname('./loaders/resolve.js')
}

const normalizeProcessCondition = (options) => {
  const dummy = () => false
  if (options === true) {
    return dummy
  } else if (typeof options === 'object') {
    return options.preprocessCondition || dummy
  }
}

class MpxPartialCompilePlugin {
  constructor (options) {
    this.pagesRecord = []
    this.involvedPageCompile = false
    this.preprocessCondition = normalizeProcessCondition(options)
  }
  
  isPreprocessPage (pageResourcePath /* 页面文件路径 */) {
    const preprocessCondition = this.preprocessCondition
    if (typeof preprocessCondition === 'string') {
      return pageResourcePath.includes(preprocessCondition)
    } else if (preprocessCondition instanceof RegExp) {
      return preprocessCondition.test(pageResourcePath)
    } else if (typeof preprocessCondition === 'function') {
      return preprocessCondition(pageResourcePath)
    }
    return false
  }

  getLoaderOptions (type) {
    return ({
      loader: type === 'pre' ? StaticPaths.preJSONLoader : StaticPaths.postJSONLoader
    })
  }

  addPageRecord (pageRecord) {
    const exists = this.pagesRecord.some(record => record.isEquals(pageRecord))
    if (!exists) {
      this.pagesRecord.push(pageRecord)
    }
  }

  needCompilingPage (path) {
    return this.pagesRecord.some(({ miniPagePath, ignored }) => (miniPagePath === path && ignored === false))
  }

  tryCompilePage (fullPath) {
    let path = parseRequest(fullPath).resourcePath
    // miniPagePath 不是绝对路径
    if (path[0] === '/') {
      path = path.slice(1)
    }
    const index = this.pagesRecord.findIndex(({ miniPagePath, ignored }) => (miniPagePath === path && ignored === true))
    if (index > -1) {
      this.pagesRecord[index].ignored = false
      return true
    }
  }

  stopCompilingPage ({ request, path }) {
    if (!this.involvedPageCompile) return false
    // 对比不带 query 的请求能更精确地阻止 mpx 的 page 解析
    request = parseRequest(request).resourcePath
    return this.pagesRecord.some(({ resolveRequest, resolveContext, ignored }) => {
      return resolveContext === path && request === resolveRequest && ignored === true
    })
  }

  startInvolvingPageCompiling () {
    this.involvedPageCompile = true
  }

  shouldRemoveSubPackagesField () {
    const subPackagePages = this.pagesRecord.filter(record => record.fromSubpackage)
    return subPackagePages.length && subPackagePages.every(record => record.ignored === true)
  }

  apply (compiler) {
    // 内部 server
    new MessageServerPlugin(this, StaticPaths.partialCompileRuntimeEntry).apply(compiler)
    // 拦截小程序路由跳转 API
    new NormalModuleReplacementPlugin(/@mpxjs\/api-proxy$/, StaticPaths.monitorNavigateAPI).apply(compiler)
    new NormalModuleReplacementPlugin(/@mpxjs\/api-proxy-original$/, '@mpxjs/api-proxy').apply(compiler)
    
    compiler.resolverFactory.hooks.resolver.intercept({
      factory: (type, hook) => {
        hook.tap('MpxPartialCompilePlugin', (resolver) => {
          resolver.hooks.resolve.tapAsync({
            name: "MpxPartialCompilePlugin",
            stage: -100
          },  (request, resolveContext, callback) => {
            // 阻断 enhance-resolve 的解析
            if (this.stopCompilingPage(request)) {
              request.path = false
              return callback(null, request)
            }
            return callback()
          })
        })
        return hook
      }
    })

    compiler.hooks.compilation.tap('MpxPartialCompilePlugin', (compilation, { normalModuleFactory }) => {

      compilation.dependencyTemplates.set(RuntimeCodeDependency, new RuntimeCodeDependency.Template())
      compilation.dependencyFactories.set(RuntimeCodeDependency, normalModuleFactory)
      compilation.dependencyTemplates.set(PartialCompileResolveDependency, new PartialCompileResolveDependency.Template())
      compilation.dependencyFactories.set(PartialCompileResolveDependency, new NullFactory())

      NormalModule.getCompilationHooks(compilation).loader.tap('MpxPartialCompilePlugin', (loaderContext) => {
        loaderContext.getMpxPartialCompilePlugin = () => {
          return this
        }
      })

      normalModuleFactory.hooks.parser.for('javascript/auto').tap('MpxPartialCompilePlugin', (parser) => {
        // 探测 createApp，注入 runtimeEntry
        parser.hooks.callMemberChain.for(harmonySpecifierTag).tap('MpxPartialCompilePlugin', (expr) => {
          if (expr.callee && expr.callee.type === 'Identifier' && expr.callee.name === 'createApp') {
            parser.state.current.addDependency(new RuntimeCodeDependency(StaticPaths.partialCompileRuntimeEntry))
          }
        })

        // 处理 ?resolve
        parser.hooks.call.for('__mpx_partial_compile_resolve_path__').tap('MpxPartialCompilePlugin', (expr) => {
          const mpx = compilation.__mpx__
          const moduleGraph = compilation.moduleGraph
          if (expr.arguments[0] && mpx) {
            const resource = expr.arguments[0].value
            const packageName = mpx.currentPackageRoot || 'main'
            const issuerResource = moduleGraph.getIssuer(parser.state.module).resource
            const range = expr.range
            const dep = new PartialCompileResolveDependency(this, resource, packageName, issuerResource, range)
            parser.state.current.addPresentationalDependency(dep)
          }
        })
      })

      normalModuleFactory.hooks.beforeResolve.tap({
        name: 'MpxPartialCompilePlugin',
        before: 'MpxWebpackPlugin'
      }, (data) => {
        let request = data.request
        let { queryObj, resource } = parseRequest(request)
        if (queryObj.resolve) {
          data.request = `!!${StaticPaths.resolvePathLoader}!${resource}`
          return true
        }
      })

      normalModuleFactory.hooks.afterResolve.tap({
        name: 'MpxPartialCompilePlugin',
        after: 'MpxWebpackPlugin'
      }, ({ createData }) => {
        const isAppEntry = (resourcePath) => {
          const mpx = compilation.__mpx__
          if (!mpx) return false
          return mpx.appInfo.resourcePath === resourcePath
        }
        const { queryObj } = parseRequest(createData.rawRequest)
        const { mpx, type } = queryObj 
        const { matchResource, loaders, resource } = createData
        // 只需要处理 app.json
        if (matchResource && mpx && type === 'json' && isAppEntry(parseRequest(resource).resourcePath)) {
          const index = loaders.findIndex(({ loader }) => loader === StaticPaths.jsonCompiler)
          // 注入前后 loader
          if (index > 0) {
            loaders.splice(index + 1, 0, this.getLoaderOptions('pre'))
            loaders.splice(index, 0, this.getLoaderOptions())
          }
        }
      })
    })
  }
}

module.exports = MpxPartialCompilePlugin
