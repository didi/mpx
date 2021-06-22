// const htmlMinifier = require('html-minifier')
const attrParse = require('./attributesParser')
const loaderUtils = require('loader-utils')
const url = require('url')
const config = require('../config')
const getMainCompilation = require('../utils/get-main-compilation')
const createHelpers = require('../helpers')
const isUrlRequest = require('../utils/is-url-request')
const addQuery = require('../utils/add-query')
const parseRequest = require('../utils/parse-request')

function randomIdent () {
  return 'xxxHTMLLINKxxx' + Math.random() + Math.random() + 'xxx'
}

module.exports = function (content) {
  const loaderContext = this
  const isProduction = this.minimize || process.env.NODE_ENV === 'production'
  const options = loaderUtils.getOptions(this) || {}
  const mpx = getMainCompilation(this._compilation).__mpx__

  const { resourcePath: filePath, queryObj } = parseRequest(this.resource)
  const moduleId = 'm' + mpx.pathHash(filePath)

  const needCssSourceMap = (
    !isProduction &&
    this.sourceMap &&
    options.cssSourceMap !== false
  )

  const hasScoped = false
  const hasComment = false
  const isNative = true

  const usingComponents = []

  const mode = mpx.mode
  const globalSrcMode = mpx.srcMode
  const localSrcMode = queryObj.mode
  const srcMode = localSrcMode || globalSrcMode
  const customAttributes = options.attributes || mpx.attributes || []

  const {
    getSrcRequestString
  } = createHelpers({
    loaderContext,
    options,
    moduleId,
    isProduction,
    hasScoped,
    hasComment,
    usingComponents,
    needCssSourceMap,
    srcMode,
    isNative,
    projectRoot: options.root || ''
  })

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
    if (!isUrlRequest(link.value, options.root)) return

    if (link.value.indexOf('mailto:') > -1) return

    // eslint-disable-next-line node/no-deprecated-api
    let uri = url.parse(link.value)
    if (uri.hash !== null && uri.hash !== undefined) {
      uri.hash = null
      link.value = uri.format()
      link.length = link.value.length
    }

    let ident
    do {
      ident = randomIdent()
    } while (data[ident])
    data[ident] = link
    let x = content.pop()
    content.push(x.substr(link.start + link.length))
    content.push(ident)
    content.push(x.substr(0, link.start))
  })
  content.reverse()
  content = content.join('')

  // if (isProduction) {
  //   const minimizeOptions = Object.assign({}, options);
  //   [
  //     'removeComments',
  //     'removeCommentsFromCDATA',
  //     'removeCDATASectionsFromCDATA',
  //     'caseSensitive',
  //     'collapseWhitespace',
  //     'conservativeCollapse',
  //     'useShortDoctype',
  //     'keepClosingSlash',
  //     'removeScriptTypeAttributes',
  //     'removeStyleTypeAttributes'
  //   ].forEach(function (name) {
  //     if (typeof minimizeOptions[name] === 'undefined') {
  //       minimizeOptions[name] = true
  //     }
  //   })
  //
  //   const KEY_IGNORECUSTOM_FRAGMENTS = 'ignoreCustomFragments'
  //   if (typeof minimizeOptions[KEY_IGNORECUSTOM_FRAGMENTS] === 'undefined') {
  //     minimizeOptions[KEY_IGNORECUSTOM_FRAGMENTS] = [/{{[\s\S]*?}}/]
  //   }
  //
  //   content = htmlMinifier.minify(content, minimizeOptions)
  // }

  content = JSON.stringify(content)

  const exportsString = 'module.exports = '

  return exportsString + content.replace(/xxxHTMLLINKxxx[0-9.]+xxx/g, function (match) {
    if (!data[match]) return match

    const link = data[match]

    let src = loaderUtils.urlToRequest(link.value, options.root)
    src = addQuery(src, { isStatic: true })

    let requestString

    switch (link.tag) {
      case 'import':
      case 'include':
        requestString = getSrcRequestString('template', { src, mode: localSrcMode }, -1)
        break
      case config[mode].wxs.tag:
        // 显式传递issuerResource避免模块缓存以及提供给wxs-loader计算相对路径
        src = addQuery(src, { issuerResource: loaderContext.resource })
        requestString = getSrcRequestString('wxs', { src, mode: localSrcMode }, -1, undefined, '!!')
        break
      default:
        requestString = JSON.stringify(src)
    }

    return '" + require(' + requestString + ') + "'
  }) + ';'
}
