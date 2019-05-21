const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const LimitChunkCountPlugin = require('webpack/lib/optimize/LimitChunkCountPlugin')
const hash = require('hash-sum')
const path = require('path')
const WxsPlugin = require('./WxsPlugin')
const getMainCompilation = require('../utils/get-main-compilation')
const stripExtension = require('../utils/strip-extention')
const toPosix = require('../utils/to-posix')
const config = require('../config')
const parseQuery = require('loader-utils').parseQuery

module.exports = function () {
  const nativeCallback = this.async()

  const mainCompilation = getMainCompilation(this._compilation)
  const mode = mainCompilation.__mpx__.mode
  const wxsMap = mainCompilation.__mpx__.wxsMap
  const componentsMap = mainCompilation.__mpx__.componentsMap
  const pagesMap = mainCompilation.__mpx__.pagesMap
  const rootName = mainCompilation._preparedEntrypoints[0].name
  const issuerResource = stripExtension(this._module.issuer.resource)
  const issuerName = pagesMap[issuerResource] || componentsMap[issuerResource] || rootName
  const issuerDir = path.dirname(issuerName)

  const callback = (err) => {
    if (err) return nativeCallback(err)
    let relativePath = toPosix(path.relative(issuerDir, wxsMap[resource]))
    nativeCallback(null, `module.exports = ${JSON.stringify(relativePath)};`)
  }

  const getName = (raw) => {
    const match = /^(.*?)(\.[^.]*)?$/.exec(raw)
    return match[1]
  }

  let resource = stripExtension(this.resource)
  const wxsModule = parseQuery(this.resourceQuery || '?').wxsModule

  if (wxsModule) {
    resource = `${resource}~${wxsModule}`
  }

  if (wxsMap[resource]) {
    callback()
  } else {
    const name = path.parse(resource).name + hash(resource)
    let filename = path.join(/^\.([^.]+)/.exec(config[mode].wxs.ext)[1], `${name}${config[mode].wxs.ext}`)
    filename = toPosix(filename)
    wxsMap[resource] = filename
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
