const path = require('path')
const loaderUtils = require('loader-utils')
const getMainCompilation = require('./utils/get-main-compilation')
const toPosix = require('./utils/to-posix')

module.exports = function loader (content) {
  const options = loaderUtils.getOptions(this) || {}
  const context = options.context || this.rootContext
  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__
  const assetsInfo = mpx.assetsInfo

  let url = loaderUtils.interpolateName(this, options.name, {
    context,
    content,
    regExp: options.regExp
  })

  let outputPath

  if (options.publicPath) {
    outputPath = url
  } else {
    outputPath = mpx.getPackageInfo(this.resource, {
      outputPath: url,
      isStatic: true,
      error: (err) => {
        this.emitError(err)
      },
      warn: (err) => {
        this.emitWarning(err)
      }
    }).outputPath
  }

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

  // 因为子编译会合并assetsInfo会互相覆盖，使用全局mpx对象收集完之后再合并到主assetsInfo中
  const assetInfo = assetsInfo.get(outputPath) || { modules: [] }
  assetInfo.modules.push(this._module)
  assetsInfo.set(outputPath, assetInfo)

  this.emitFile(outputPath, content)

  // TODO revert to ES2015 Module export, when new CSS Pipeline is in place
  return `module.exports = ${publicPath};`
}

module.exports.raw = true
