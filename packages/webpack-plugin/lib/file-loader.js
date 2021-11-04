const path = require('path')
const loaderUtils = require('loader-utils')
const getMainCompilation = require('./utils/get-main-compilation')
const toPosix = require('./utils/to-posix')
const parseQuery = require('./utils/parse-request')
module.exports = function loader (content, prevOptions) {
  const options = prevOptions || loaderUtils.getOptions(this) || {}
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
    if (options.outputPathCDN) {
      if (typeof options.outputPathCDN === 'function') {
        outputPath = options.outputPathCDN(outputPath, this.resourcePath, context)
      } else {
        outputPath = toPosix(path.join(options.outputPathCDN, outputPath))
      }
    }
  } else {
    url = outputPath = mpx.getPackageInfo({
      resource: this.resource,
      outputPath: url,
      resourceType: 'staticResources',
      warn: (err) => {
        this.emitWarning(err)
      }
    }).outputPath
  }

  const { queryObj } = parseQuery(this.resource)
  let publicPath = options.mode === 'ks'&& queryObj?.currentName ==='app' ? JSON.stringify(url) :`__webpack_public_path__ + ${JSON.stringify(url)}`

  if (options.publicPath) {
    if (typeof options.publicPath === 'function') {
      publicPath = options.publicPath(url, this.resourcePath, context)
    } else {
      publicPath = `${options.publicPath.endsWith('/')
        ? options.publicPath
        : `${options.publicPath}/`}${url}`
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
