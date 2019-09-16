const path = require('path')
const loaderUtils = require('loader-utils')
const getMainCompilation = require('./utils/get-main-compilation')
const toPosix = require('./utils/to-posix')
const getResourcePath = require('./utils/get-resource-path')

module.exports = function loader (content) {
  const options = loaderUtils.getOptions(this) || {}
  const context = options.context || this.rootContext
  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__
  const packageName = mpx.processingSubPackageRoot || 'main'
  const resourceMap = mpx.resourceMap
  const resourceHit = mpx.resourceHit
  const currentResourceMap = resourceMap[packageName]
  const resourcePath = getResourcePath(this.resource)

  let url = loaderUtils.interpolateName(this, options.name, {
    context,
    content,
    regExp: options.regExp
  })

  let subPackageRoot = ''
  if (mpx.processingSubPackageRoot) {
    if (!resourceMap.main[resourcePath]) {
      subPackageRoot = mpx.processingSubPackageRoot
    }
  }

  url = toPosix(path.join(subPackageRoot, url))

  currentResourceMap[resourcePath] = url
  resourceHit[resourceMap] = true

  let outputPath = url

  if (options.outputPath) {
    if (typeof options.outputPath === 'function') {
      outputPath = options.outputPath(url, this.resourcePath, context)
    } else {
      outputPath = path.posix.join(options.outputPath, url)
    }
  }

  let publicPath = `__webpack_public_path__ + ${JSON.stringify(outputPath)}`

  if (options.publicPath) {
    if (typeof options.publicPath === 'function') {
      publicPath = options.publicPath(url, this.resourcePath, context)
    } else {
      publicPath = `${
        options.publicPath.endsWith('/')
          ? options.publicPath
          : `${options.publicPath}/`
      }${url}`
    }

    publicPath = JSON.stringify(publicPath)
  }

  if (typeof options.emitFile === 'undefined' || options.emitFile) {
    this.emitFile(outputPath, content)
  }

  // TODO revert to ES2015 Module export, when new CSS Pipeline is in place
  return `module.exports = ${publicPath};`
}

module.exports.raw = true
