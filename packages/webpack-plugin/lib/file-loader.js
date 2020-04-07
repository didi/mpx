const path = require('path')
const loaderUtils = require('loader-utils')
const getMainCompilation = require('./utils/get-main-compilation')
const toPosix = require('./utils/to-posix')

module.exports = function loader (content) {
  const options = loaderUtils.getOptions(this) || {}
  const context = options.context || this.rootContext
  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__

  let url = loaderUtils.interpolateName(this, options.name, {
    context,
    content,
    regExp: options.regExp
  })

  let { outputPath } = mpx.getPackageInfo(this.resource, {
    outputPath: url,
    isStatic: true,
    error: (err) => {
      this.emitError(err)
    }
  })

  if (options.outputPath) {
    if (typeof options.outputPath === 'function') {
      outputPath = options.outputPath(outputPath, this.resourcePath, context)
    } else {
      outputPath = toPosix(path.join(options.outputPath, outputPath))
    }
  }

  let publicPath = `__webpack_public_path__ + ${JSON.stringify(outputPath)}`

  if (options.publicPath) {
    if (typeof options.publicPath === 'function') {
      publicPath = options.publicPath(outputPath, this.resourcePath, context)
    } else {
      publicPath = `${
        options.publicPath.endsWith('/')
          ? options.publicPath
          : `${options.publicPath}/`
        }${outputPath}`
    }
    publicPath = JSON.stringify(publicPath)
  }

  this.emitFile(outputPath, content)

  // TODO revert to ES2015 Module export, when new CSS Pipeline is in place
  return `module.exports = ${publicPath};`
}

module.exports.raw = true
