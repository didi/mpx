const path = require('path')
const normalize = require('@mpxjs/utils/normalize')
const addQuery = require(normalize.utils('add-query'))
const parseRequest = require(normalize.utils('parse-request'))
const loaderUtils = require('loader-utils')
const resolve = require('../utils/resolve')
const isUrlRequestRaw = require('@mpxjs/utils/is-url-request')
const mpx = require('../mpx')

module.exports = function createJSONHelper ({ loaderContext, emitWarning, customGetDynamicEntry }) {
  const externals = mpx.externals
  const root = mpx.projectRoot
  const publicPath = (loaderContext._compilation && loaderContext._compilation.outputOptions.publicPath) || ''
  const getOutputPath = mpx.getOutputPath

  const isUrlRequest = r => isUrlRequestRaw(r, root, externals)
  const urlToRequest = r => loaderUtils.urlToRequest(r)
  const getDynamicEntry = (request, type, outputPath = '', packageRoot = '', relativePath = '', context = '') => {
    if (typeof customGetDynamicEntry === 'function') return customGetDynamicEntry(request, type, outputPath, packageRoot, relativePath, context)
  }
  const processComponent = (component, context, { tarRoot = '', outputPath = '', relativePath = '' }, callback) => {
    if (!isUrlRequest(component)) return callback(null, component)

    resolve(context, component, loaderContext, (err, resource, info) => {
      if (err) return callback(err)
      const { resourcePath, queryObj } = parseRequest(resource)

      if (queryObj.root) {
        // 删除root query
        resource = addQuery(resource, {}, false, ['root'])
      }

      if (!outputPath) {
        outputPath = getOutputPath(resourcePath, 'component')
      }

      const entry = getDynamicEntry(resource, 'component', outputPath, tarRoot, relativePath)
      callback(null, entry)
    })
  }

  const processPage = (page, context, tarRoot = '', callback) => {
    let aliasPath = ''
    if (typeof page !== 'string') {
      aliasPath = page.path
      page = page.src
    }
    if (!isUrlRequest(page)) return callback(null, page)
    // 增加 page 标识
    page = addQuery(page, { isPage: true })
    resolve(context, page, loaderContext, (err, resource) => {
      if (err) return callback(err)
      const { resourcePath, queryObj: { isFirst } } = parseRequest(resource)
      // const ext = path.extname(resourcePath)
      let outputPath
      if (aliasPath) {
        outputPath = aliasPath.replace(/^\//, '')
      } else {
        const relative = path.relative(context, resourcePath)
        if (/^\./.test(relative)) {
          // 如果当前page不存在于context中，对其进行重命名
          outputPath = getOutputPath(resourcePath, 'page')
          emitWarning(`Current page [${resourcePath}] is not in current pages directory [${context}], the page path will be replaced with [${outputPath}], use ?resolve to get the page path and navigate to it!`)
        } else {
          outputPath = /^(.*?)(\.[^.]*)?$/.exec(relative)[1]
        }
      }
      const entry = getDynamicEntry(resource, 'page', outputPath, tarRoot, publicPath + tarRoot)
      const key = [resourcePath, outputPath, tarRoot].join('|')
      callback(null, entry, {
        isFirst,
        key
      })
    })
  }

  return {
    processComponent,
    processPage,
    isUrlRequest,
    urlToRequest
  }
}
