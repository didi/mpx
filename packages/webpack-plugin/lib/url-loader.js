const loaderUtils = require('loader-utils')
const mime = require('mime')
const getOptions = loaderUtils.getOptions
const parseQuery = loaderUtils.parseQuery

function isStyle (request) {
  let elements = request.replace(/^-?!+/, '').replace(/!!+/g, '!').split('!')
  elements.pop()
  for (let i = 0; i < elements.length; i++) {
    let element = elements[i]
    let queryString = '?'
    let loaderString = element
    let idx = element.indexOf('?')
    if (idx >= 0) {
      queryString = element.substr(idx)
      loaderString = element.substr(0, idx)
    }
    if (/css-loader/.test(loaderString)) {
      return true
    }
    if (/content-loader/.test(loaderString)) {
      let query = parseQuery(queryString)
      if (query.type === 'styles') {
        return true
      }
    }
  }
  return false
}

module.exports = function (src) {
  let transBase64 = false
  const options = Object.assign({}, getOptions(this))
  const filePath = this.resourcePath
  const mimetype = options.mimetype || mime.getType(filePath)
  const issuer = this._module.issuer
  const queryOption = parseQuery(this.resourceQuery || '?')

  if (issuer && issuer.request && isStyle(issuer.request) || queryOption.isStyle) {
    if (options.publicPath) {
      const limit = options.limit
      if (!limit || src.length < limit) {
        transBase64 = true
      }
      if (queryOption.fallback) {
        transBase64 = false
      }
    } else {
      transBase64 = true
    }
    // 如果设置了outputPathCDN且当前资源不为style时，则将传递给file-loader的publicPath删除，仅将style中的图像资源改为CDN地址
    // 如果没有设置outputPathCDN则不删除publicPath，全局的非base64的图像资源都会被改为CDN地址
  } else if (options.outputPathCDN) {
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
