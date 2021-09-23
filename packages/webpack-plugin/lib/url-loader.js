const loaderUtils = require('loader-utils')
const mime = require('mime')
const parseRequest = require('./utils/parse-request')
const getOptions = loaderUtils.getOptions
const parseQuery = loaderUtils.parseQuery

function isStyleRequest (request) {
  const { loaderString, queryObj } = parseRequest(request)
  if (queryObj.type === 'styles') return true
  if (/(css-loader|wxss\/loader)/.test(loaderString)) return true
  return false
}

module.exports = function (src) {
  let transBase64 = false
  const options = Object.assign({}, getOptions(this))
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const mimetype = options.mimetype || mime.getType(resourcePath)
  const moduleGraph = this._compilation.moduleGraph
  const issuer = moduleGraph.getIssuer(this._module)
  const publicPathScope = options.publicPathScope === 'all' ? 'all' : 'styleOnly'
  const limit = options.limit
  const useLocal = !limit || src.length < limit || queryObj.useLocal
  const isStyle = (issuer && issuer.request && isStyleRequest(issuer.request)) || queryObj.isStyle

  if (isStyle) {
    if (options.publicPath) {
      if (useLocal) {
        transBase64 = true
      }
      if (queryObj.fallback) {
        transBase64 = false
      }
    } else {
      transBase64 = true
    }
  } else if (publicPathScope === 'styleOnly' || useLocal) {
    // 如果设置了publicPathScope为styleOnly且当前资源不为style时，则将传递给file-loader的publicPath删除，仅将style中的非local图像资源改为CDN地址
    // 否则全局的非local的图像资源都会被改为CDN地址
    delete options.publicPath
  }

  if (transBase64) {
    if (typeof src === 'string') {
      src = Buffer.from(src)
    }
    return `module.exports = ${JSON.stringify(
      `data:${mimetype || ''};base64,${src.toString('base64')}`
    )}`
  } else {
    const fallback = require(options.fallback ? options.fallback : './file-loader')
    return fallback.call(this, src, options)
  }
}

module.exports.raw = true
