const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const LimitChunkCountPlugin = require('webpack/lib/optimize/LimitChunkCountPlugin')
const hash = require('hash-sum')
const path = require('path')
const WxsPlugin = require('./WxsPlugin')
const getMainCompilation = require('../utils/get-main-compilation')
const getResourcePath = require('../utils/get-resource-path')
const toPosix = require('../utils/to-posix')
const fixSwanRelative = require('../utils/fix-swan-relative')
const config = require('../config')
const parseQuery = require('loader-utils').parseQuery

module.exports = function () {
  const nativeCallback = this.async()

  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__
  const mode = mpx.mode
  const wxsMap = mpx.wxsMap
  const packageName = mpx.processingSubPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const rootName = mainCompilation._preparedEntrypoints[0].name
  // 可能存在问题，issuer不可靠，但是目前由于每一个组件模板都是在独立的子编译中输出的，所以此处issuer没有遇到问题，可以考虑通过query传递issuerResource
  const issuerResourcePath = getResourcePath(this._module.issuer.resource)
  const issuerName = pagesMap[issuerResourcePath] || componentsMap[issuerResourcePath] || rootName
  const issuerDir = path.dirname(issuerName)

  const callback = (err) => {
    if (err) return nativeCallback(err)
    let relativePath = toPosix(path.relative(issuerDir, wxsMap[resourcePath]))
    if (mode === 'swan') {
      relativePath = fixSwanRelative(relativePath)
    }
    nativeCallback(null, `module.exports = ${JSON.stringify(relativePath)};`)
  }

  const getName = (raw) => {
    const match = /^(.*?)(\.[^.]*)?$/.exec(raw)
    return match[1]
  }

  let resourcePath = getResourcePath(this.resource)
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
    const request = this.resource
    const plugins = [
      new WxsPlugin({ mode }),
      new NodeTargetPlugin(),
      new SingleEntryPlugin(this.context, request, getName(filename)),
      new LimitChunkCountPlugin({ maxChunks: 1 })
    ]

    const childCompiler = mainCompilation.createChildCompiler(request, outputOptions, plugins)

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
