const path = require('path')
const loaderUtils = require('loader-utils')
const toPosix = require('./utils/to-posix')
const parseRequest = require('./utils/parse-request')
const RecordResourceMapDependency = require('./dependencies/RecordResourceMapDependency')

module.exports = function loader (content, prevOptions) {
  const options = prevOptions || loaderUtils.getOptions(this) || {}
  const context = options.context || this.rootContext
  const mpx = this.getMpx()
  const isRN = ['ios', 'android', 'harmony'].includes(mpx.mode)

  let url = loaderUtils.interpolateName(this, options.name, {
    context,
    content,
    regExp: options.regExp
  })

  let outputPath = url

  if (options.publicPath) {
    if (options.outputPathCDN) {
      if (typeof options.outputPathCDN === 'function') {
        outputPath = options.outputPathCDN(outputPath, this.resourcePath, context)
      } else {
        outputPath = toPosix(path.join(options.outputPathCDN, outputPath))
      }
    }
  } else {
    const { resourcePath, queryObj } = parseRequest(this.resource)
    const packageRoot = queryObj.packageRoot || ''
    url = outputPath = toPosix(path.join(packageRoot, outputPath))
    this._module.addPresentationalDependency(new RecordResourceMapDependency(resourcePath, 'staticResource', outputPath, packageRoot))
  }

  let publicPath = `__webpack_public_path__ + ${JSON.stringify(url)}`

  if (isRN) publicPath = JSON.stringify(`./${url}`)

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

  this.emitFile(outputPath, content)

  // TODO revert to ES2015 Module export, when new CSS Pipeline is in place
  return `module.exports = ${isRN ? `__non_webpack_require__(${publicPath})` : publicPath}`
}

module.exports.raw = true
