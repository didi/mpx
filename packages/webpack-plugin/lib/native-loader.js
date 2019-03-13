const hash = require('hash-sum')
const path = require('path')
const stripExtension = require('./utils/strip-extention')
const loaderUtils = require('loader-utils')
const config = require('./config')
const createHelpers = require('./helpers')

module.exports = function (content) {
  this.cacheable()

  if (!this._compilation.__mpx__) {
    return content
  }

  const loaderContext = this
  const isProduction = this.minimize || process.env.NODE_ENV === 'production'
  const options = loaderUtils.getOptions(this) || {}

  const filePath = this.resourcePath

  const context = (
    this.rootContext ||
    (this.options && this.options.context) ||
    process.cwd()
  )
  const shortFilePath = path.relative(context, filePath).replace(/^(\.\.[\\/])+/, '')
  const moduleId = hash(isProduction ? (shortFilePath + '\n' + content) : shortFilePath)

  const needCssSourceMap = (
    !isProduction &&
    this.sourceMap &&
    options.cssSourceMap !== false
  )

  const hasScoped = false
  const hasComment = false
  const isNative = true

  const usingComponents = []

  const mode = this._compilation.__mpx__.mode
  const pagesMap = this._compilation.__mpx__.pagesMap
  const componentsMap = this._compilation.__mpx__.componentsMap
  const resource = stripExtension(this.resource)
  const isApp = !pagesMap[resource] && !componentsMap[resource]

  const {
    getRequireForSrc,
    getNamedExportsForSrc
  } = createHelpers(
    loaderContext,
    options,
    moduleId,
    isProduction,
    hasScoped,
    hasComment,
    usingComponents,
    needCssSourceMap,
    mode,
    isNative
  )

  const typeExtMap = config[mode].typeExtMap

  function getRequire (type) {
    let src = resource + typeExtMap[type]
    if (type === 'template' && isApp) {
      return ''
    }
    if (type === 'json') {
      src = src + '?__component'
    }
    if (type === 'script') {
      return getNamedExportsForSrc(type, { src })
    } else {
      return getRequireForSrc(type, { src })
    }
  }

  let output = ''

  for (let type in typeExtMap) {
    output += `/* ${type} */\n${getRequire(type)}\n\n`
  }

  return output
}
