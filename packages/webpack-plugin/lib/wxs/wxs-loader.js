const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const LimitChunkCountPlugin = require('webpack/lib/optimize/LimitChunkCountPlugin')
const hash = require('hash-sum')
const path = require('path')
const WxsPlugin = require('./WxsPlugin')
const getMainCompilation = require('../utils/get-main-compilation')
const parseRequest = require('../utils/parse-request')
const toPosix = require('../utils/to-posix')
const fixRelative = require('../utils/fix-relative')
const normalize = require('../utils/normalize')
const config = require('../config')
const parseQuery = require('loader-utils').parseQuery

module.exports = function (content) {
  const nativeCallback = this.async()

  const options = loaderUtils.getOptions(this) || {}
  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__
  const mode = mpx.mode
  const wxsMap = mpx.wxsMap
  const packageName = mpx.currentPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const rootName = mainCompilation._preparedEntrypoints[0].name
  // 可能存在问题，issuer不可靠，但是目前由于每一个组件模板都是在独立的子编译中输出的，所以此处issuer没有遇到问题，可以考虑通过query传递issuerResource
  const issuerResourcePath = parseRequest(this._module.issuer.resource).resourcePath
  const issuerName = pagesMap[issuerResourcePath] || componentsMap[issuerResourcePath] || rootName
  const issuerDir = path.dirname(issuerName)

  const callback = (err) => {
    if (err) return nativeCallback(err)
    let relativePath = toPosix(path.relative(issuerDir, wxsMap[resourcePath]))
    relativePath = fixRelative(relativePath, mode)
    nativeCallback(null, `module.exports = ${JSON.stringify(relativePath)};`)
  }

  const getName = (raw) => {
    const match = /^(.*?)(\.[^.]*)?$/.exec(raw)
    return match[1]
  }

  let resourcePath = parseRequest(this.resource).resourcePath
  const wxsModule = parseQuery(this.resourceQuery || '?').wxsModule

  if (wxsModule) {
    resourcePath = `${resourcePath}~${wxsModule}`
  }

  if (wxsMap[resourcePath]) {
    callback()
  } else {
    const name = path.parse(resourcePath).name + hash(resourcePath)
    let filename = path.join(/^\.([^.]+)/.exec(config[mode].wxs.ext)[1], `${name}${config[mode].wxs.ext}`)
    filename = toPosix(filename)
    wxsMap[resourcePath] = filename
    const outputOptions = {
      filename
    }
    const contentLoader = normalize.lib('content-loader')
    const request = `!!${contentLoader}?${JSON.stringify(options)}!${this.resource}`
    const plugins = [
      new WxsPlugin({ mode }),
      new NodeTargetPlugin(),
      new SingleEntryPlugin(this.context, request, getName(filename)),
      new LimitChunkCountPlugin({ maxChunks: 1 })
    ]

    const childCompiler = mainCompilation.createChildCompiler(request, outputOptions, plugins)

    childCompiler.hooks.thisCompilation.tap('MpxWebpackPlugin ', (compilation) => {
      compilation.hooks.normalModuleLoader.tap('MpxWebpackPlugin', (loaderContext) => {
        // 传递编译结果，子编译器进入content-loader后直接输出
        loaderContext.__mpx__ = {
          content,
          fileDependencies: this.getDependencies(),
          contextDependencies: this.getContextDependencies()
        }
      })
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
}
