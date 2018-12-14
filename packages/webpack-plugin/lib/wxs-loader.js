const WxsTemplatePlugin = require('./template/WxsTemplatePlugin')
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const LimitChunkCountPlugin = require('webpack/lib/optimize/LimitChunkCountPlugin')
const getMainCompilation = require('./utils/get-main-compilation')
const stripExtension = require('./utils/strip-extention')
const hash = require('hash-sum')
const path = require('path')

module.exports = function () {
  const nativeCallback = this.async()

  const mainCompilation = getMainCompilation(this._compilation)
  const wxsMap = mainCompilation.__mpx__.wxsMap
  const componentsMap = mainCompilation.__mpx__.componentsMap
  const pagesMap = mainCompilation.__mpx__.pagesMap
  const rootName = mainCompilation._preparedEntrypoints[0].name
  const issuerResource = stripExtension(this._module.issuer.resource)
  const issuerName = pagesMap[issuerResource] || componentsMap[issuerResource] || rootName
  const issuerDir = path.dirname(issuerName)

  const callback = (err) => {
    if (err) return nativeCallback(err)
    nativeCallback(null, `module.exports = ${JSON.stringify(path.posix.relative(issuerDir, wxsMap[resource]))};`)
  }

  const resource = stripExtension(this.resource)
  if (wxsMap[resource]) {
    callback()
  } else {
    const name = path.parse(resource).name + hash(resource)
    const filename = path.posix.join('wxs', `${name}.wxs`)
    wxsMap[resource] = filename
    const outputOptions = {
      filename
    }
    const request = `!!${this.resource}`
    const childCompiler = mainCompilation.createChildCompiler(request, outputOptions, [
      new WxsTemplatePlugin(),
      new LibraryTemplatePlugin(null, 'commonjs2'),
      new NodeTargetPlugin(),
      new SingleEntryPlugin(this.context, request, filename),
      new LimitChunkCountPlugin({ maxChunks: 1 })
    ])

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
