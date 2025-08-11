const attrParse = require('./attributesParser')
const loaderUtils = require('loader-utils')
const url = require('url')
const config = require('../config')
const createHelpers = require('../helpers')
const isUrlRequest = require('../utils/is-url-request')
const parseRequest = require('../utils/parse-request')
const genDynamicTemplate = require('../runtime-render/gen-dynamic-template')

let count = 0

function countIdent () {
  return `__HTMLLINK__${count++}__`
}

module.exports = function (content) {
  const options = loaderUtils.getOptions(this) || {}
  const mpx = this.getMpx()
  const root = mpx.projectRoot
  const externals = mpx.externals

  const { queryObj } = parseRequest(this.resource)
  const hasScoped = false
  const hasComment = false
  const isNative = false

  const mode = mpx.mode
  const localSrcMode = queryObj.mode
  const customAttributes = options.attributes || mpx.attributes || []
  const packageName = queryObj.packageRoot || mpx.currentPackageRoot || 'main'
  const isDynamic = queryObj.isDynamic

  const exportsString = 'module.exports = '

  if (isDynamic) {
    return exportsString + JSON.stringify(genDynamicTemplate(packageName)) + ';'
  }

  const { getRequestString } = createHelpers(this)

  const attributes = ['image:src', 'audio:src', 'video:src', 'cover-image:src', 'import:src', 'include:src', `${config[mode].wxs.tag}:${config[mode].wxs.src}`].concat(customAttributes)

  const links = attrParse(content, function (tag, attr) {
    const res = attributes.find(function (a) {
      if (a.charAt(0) === ':') {
        return attr === a.slice(1)
      } else {
        return (tag + ':' + attr) === a
      }
    })
    return !!res
  })
  links.reverse()
  const data = {}
  content = [content]
  links.forEach(function (link) {
    if (!isUrlRequest(link.value, root, externals)) return

    if (link.value.indexOf('mailto:') > -1) return

    // eslint-disable-next-line node/no-deprecated-api
    const uri = url.parse(link.value)
    if (uri.hash !== null && uri.hash !== undefined) {
      uri.hash = null
      link.value = uri.format()
      link.length = link.value.length
    }

    let ident
    do {
      ident = countIdent()
    } while (data[ident])
    data[ident] = link
    const x = content.pop()
    content.push(x.substr(link.start + link.length))
    content.push(ident)
    content.push(x.substr(0, link.start))
  })
  content.reverse()
  content = content.join('')
  content = JSON.stringify(content)

  return exportsString + content.replace(/__HTMLLINK__\d+__/g, (match) => {
    if (!data[match]) return match

    const link = data[match]

    const src = loaderUtils.urlToRequest(link.value, root)

    let requestString, extraOptions

    switch (link.tag) {
      case 'import':
      case 'include':
        extraOptions = {
          hasScoped,
          hasComment,
          isNative,
          isStatic: true
        }
        requestString = getRequestString('template', { src, mode: localSrcMode }, extraOptions)
        break
      case config[mode].wxs.tag:
        // 显式传递issuerResource避免模块缓存以及提供给wxs-loader计算相对路径
        extraOptions = {
          issuerResource: this.resource,
          isStatic: true
        }
        requestString = getRequestString('wxs', { src, mode: localSrcMode }, extraOptions)
        break
      default:
        requestString = JSON.stringify(src)
    }

    return '" + require(' + requestString + ') + "'
  }) + ';'
}
