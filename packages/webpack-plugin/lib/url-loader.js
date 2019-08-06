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
  const options = getOptions(this) || {}

  const file = this.resourcePath
  const mimetype = options.mimetype || mime.getType(file)

  // const limit = options.limit
  // if (!limit || src.length < limit) {
  //   transBase64 = true
  // }

  const queryOption = parseQuery(this.resourceQuery || '?')
  if (queryOption.fallback) {
    transBase64 = false
  }

  const issuer = this._module.issuer

  if (issuer && issuer.request && isStyle(issuer.request)) {
    transBase64 = true
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
    return fallback.call(this, src)
  }
}

module.exports.raw = true
