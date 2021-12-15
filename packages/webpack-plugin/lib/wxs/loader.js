const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const EntryPlugin = require('webpack/lib/EntryPlugin')
const LimitChunkCountPlugin = require('webpack/lib/optimize/LimitChunkCountPlugin')
const path = require('path')
const WxsPlugin = require('./WxsPlugin')
const RecordResourceMapDependency = require('../dependencies/RecordResourceMapDependency')
const parseRequest = require('../utils/parse-request')
const toPosix = require('../utils/to-posix')
const fixRelative = require('../utils/fix-relative')
const config = require('../config')

module.exports = function () {
  const nativeCallback = this.async()
  const moduleGraph = this._compilation.moduleGraph
  const mpx = this.getMpx()
  const mode = mpx.mode
  const getOutputPath = mpx.getOutputPath
  let { resourcePath, queryObj } = parseRequest(this.resource)
  const issuer = moduleGraph.getIssuer(this._module)
  const { resourcePath: issuerResourcePath, queryObj: issuerQueryObj } = parseRequest(queryObj.issuerResource || issuer.resource)
  const issuerPackageName = issuerQueryObj.packageRoot || mpx.currentPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[issuerPackageName]
  const staticResourcesMap = mpx.staticResourcesMap[issuerPackageName]
  const issuerName = pagesMap[issuerResourcePath] || componentsMap[issuerResourcePath] || staticResourcesMap[issuerResourcePath]
  const issuerDir = path.dirname(issuerName)

  const getName = (raw) => {
    const match = /^(.*?)(\.[^.]*)?$/.exec(raw)
    return match[1]
  }

  const wxsModule = queryObj.wxsModule
  if (wxsModule) {
    resourcePath = `${resourcePath}~${wxsModule}`
  }
  const packageRoot = queryObj.packageRoot || ''
  const ext = config[mode].wxs.ext
  const filename = toPosix(path.join(packageRoot, getOutputPath(resourcePath, ext.slice(1), { ext })))
  this._module.addPresentationalDependency(new RecordResourceMapDependency(resourcePath, 'staticResource', filename, packageRoot))

  const callback = (err) => {
    if (err) return nativeCallback(err)
    let relativePath = toPosix(path.relative(issuerDir, filename))
    relativePath = fixRelative(relativePath, mode)
    nativeCallback(null, `module.exports = ${JSON.stringify(relativePath)};`)
  }

  const outputOptions = {
    filename,
    // 避免输出的wxs中包含es语法
    environment: {
      // The environment supports arrow functions ('() => { ... }').
      arrowFunction: false,
      // The environment supports BigInt as literal (123n).
      bigIntLiteral: false,
      // The environment supports const and let for variable declarations.
      const: false,
      // The environment supports destructuring ('{ a, b } = obj').
      destructuring: false,
      // The environment supports an async import() function to import EcmaScript modules.
      dynamicImport: false,
      // The environment supports 'for of' iteration ('for (const x of array) { ... }').
      forOf: false,
      // The environment supports ECMAScript Module syntax to import ECMAScript modules (import ... from '...').
      module: false
    }
  }
  // wxs文件必须经过pre-loader
  const request = '!!' + this.remainingRequest
  const plugins = [
    new WxsPlugin({ mode }),
    new NodeTargetPlugin(),
    new EntryPlugin(this.context, request, { name: getName(filename) }),
    new LimitChunkCountPlugin({ maxChunks: 1 })
  ]

  const childCompiler = this._compilation.createChildCompiler(resourcePath, outputOptions, plugins)

  childCompiler.hooks.afterCompile.tap('MpxWebpackPlugin', (compilation) => {
    // 持久化缓存，使用module.buildInfo.assets来输出文件
    compilation.getAssets().forEach(({ name, source, info }) => {
      this.emitFile(name, source.source(), undefined, info)
    })
    compilation.clearAssets()
  })

  childCompiler.runAsChild((err, entries, compilation) => {
    if (err) return callback(err)
    if (compilation.errors.length > 0) {
      return callback(compilation.errors[0])
    }

    compilation.fileDependencies.forEach((dep) => {
      this.addDependency(dep)
    }, this)
    compilation.contextDependencies.forEach((dep) => {
      this.addContextDependency(dep)
    }, this)
    compilation.missingDependencies.forEach((dep) => {
      this.addMissingDependency(dep)
    })
    compilation.buildDependencies.forEach((dep) => {
      this.addBuildDependency(dep)
    })
    callback()
  })
}
