const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const LimitChunkCountPlugin = require('webpack/lib/optimize/LimitChunkCountPlugin')
const hash = require('hash-sum')
const path = require('path')
const WxsPlugin = require('./WxsPlugin')
const ChildCompileDependency = require('../dependency/ChildCompileDependency')
const getMainCompilation = require('../utils/get-main-compilation')
const parseRequest = require('../utils/parse-request')
const toPosix = require('../utils/to-posix')
const fixRelative = require('../utils/fix-relative')
const config = require('../config')

module.exports = function () {
  const nativeCallback = this.async()
  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__
  const assetsInfo = mpx.assetsInfo
  const mode = mpx.mode
  const wxsMap = mpx.wxsMap
  const rootName = mainCompilation._preparedEntrypoints[0].name
  let { resourcePath, queryObj } = parseRequest(this.resource)
  const { resourcePath: issuerResourcePath, queryObj: issuerQueryObj } = parseRequest(queryObj.issuerResource || this._module.issuer.resource)
  const issuerPackageName = issuerQueryObj.packageName || mpx.currentPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[issuerPackageName]
  const staticResourceMap = mpx.staticResourceMap[issuerPackageName]
  const issuerName = pagesMap[issuerResourcePath] || componentsMap[issuerResourcePath] || staticResourceMap[issuerResourcePath] || rootName
  const issuerDir = path.dirname(issuerName)

  const getName = (raw) => {
    const match = /^(.*?)(\.[^.]*)?$/.exec(raw)
    return match[1]
  }

  const wxsModule = queryObj.wxsModule
  if (wxsModule) {
    resourcePath = `${resourcePath}~${wxsModule}`
  }

  const name = path.parse(resourcePath).name + hash(resourcePath)
  let filename = path.join(/^\.([^.]+)/.exec(config[mode].wxs.ext)[1], `${name}${config[mode].wxs.ext}`)

  filename = mpx.getPackageInfo({
    resource: this.resource,
    outputPath: filename,
    isStatic: true,
    warn: (err) => {
      this.emitWarning(err)
    }
  }).outputPath

  const callback = (err) => {
    if (err) return nativeCallback(err)
    let relativePath = toPosix(path.relative(issuerDir, filename))
    relativePath = fixRelative(relativePath, mode)
    nativeCallback(null, `module.exports = ${JSON.stringify(relativePath)};`)
  }

  if (wxsMap[filename]) {
    wxsMap[filename].modules.push(this._module)
    return callback()
  }

  wxsMap[filename] = {
    dep: null,
    modules: [this._module]
  }

  const outputOptions = {
    filename
  }
  // wxs文件必须经过pre-loader
  const request = `!${this.remainingRequest}`
  const plugins = [
    new WxsPlugin({ mode }),
    new NodeTargetPlugin(),
    new SingleEntryPlugin(this.context, request, getName(filename)),
    new LimitChunkCountPlugin({ maxChunks: 1 })
  ]

  const childCompiler = mainCompilation.createChildCompiler(request, outputOptions, plugins)

  let entryModule
  childCompiler.hooks.thisCompilation.tap('MpxWebpackPlugin ', (compilation) => {
    compilation.hooks.succeedEntry.tap('MpxWebpackPlugin', (entry, name, module) => {
      entryModule = module
      const dep = new ChildCompileDependency(entryModule)
      wxsMap[filename].dep = dep
    })
  })

  childCompiler.hooks.afterCompile.tapAsync('MpxWebpackPlugin', (compilation, callback) => {
    Object.keys(compilation.assets).forEach((name) => {
      // 因为子编译会合并assetsInfo会互相覆盖，使用全局mpx对象收集完之后再合并到主assetsInfo中
      const assetInfo = assetsInfo.get(name) || { modules: [] }
      assetInfo.modules.push(entryModule)
      assetsInfo.set(name, assetInfo)
    })
    callback()
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
    callback()
  })
}
