const path = require('path')
const loaderUtils = require('loader-utils')
const getMainCompilation = require('./utils/get-main-compilation')
const toPosix = require('./utils/to-posix')

module.exports = function loader (content) {
  const options = loaderUtils.getOptions(this) || {}
  const context = options.context || this.rootContext
  const mainCompilation = getMainCompilation(this._compilation)
  const compilationMpx = mainCompilation.__mpx__
  const subPackagesMap = compilationMpx.subPackagesMap
  const mainResourceMap = compilationMpx.mainResourceMap
  const resourcePath = this.resourcePath

  let url = loaderUtils.interpolateName(this, options.name, {
    context,
    content,
    regExp: options.regExp
  })

  let subPackageRoot = ''
  if (compilationMpx.processingSubPackages) {
    for (let src in subPackagesMap) {
      // 分包引用且主包未引用的资源，需打入分包目录中
      if (resourcePath.startsWith(src) && !mainResourceMap[resourcePath]) {
        subPackageRoot = subPackagesMap[src]
        break
      }
    }
  } else {
    mainResourceMap[resourcePath] = true
  }

  url = toPosix(path.join(subPackageRoot, url))

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
