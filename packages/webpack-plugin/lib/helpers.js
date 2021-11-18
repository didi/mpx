const loaderUtils = require('loader-utils')
const normalize = require('./utils/normalize')
const selectorPath = normalize.lib('selector')
const addQuery = require('./utils/add-query')
const parseRequest = require('./utils/parse-request')

function getRawRequest ({ resource, loaderIndex, loaders }, excludedPreLoaders = /eslint-loader/) {
  return loaderUtils.getRemainingRequest({
    resource: resource,
    loaderIndex: loaderIndex,
    loaders: loaders.filter(loader => !excludedPreLoaders.test(loader.path))
  })
}

const defaultLang = {
  template: 'wxml',
  styles: 'wxss',
  script: 'js',
  json: 'json',
  wxs: 'wxs'
}

module.exports = function createHelpers (loaderContext) {
  const rawRequest = getRawRequest(loaderContext)

  function getRequire (type, part, extraOptions, index) {
    return 'require(' + getRequestString(type, part, extraOptions, index) + ')'
  }

  function getImport (type, part, extraOptions, index) {
    return (
      'import __' + type + '__ from ' +
      getRequestString(type, part, extraOptions, index)
    )
  }

  function getNamedExports (type, part, extraOptions, index) {
    return (
      'export * from ' +
      getRequestString(type, part, extraOptions, index)
    )
  }

  function getFakeRequest (type, part) {
    const lang = part.lang || defaultLang[type] || type
    const { resourcePath, queryObj } = parseRequest(loaderContext.resource)
    if (lang === 'json') queryObj.asScript = true
    return addQuery(`${resourcePath}.${lang}`, queryObj)
  }

  function getRequestString (type, part, extraOptions = {}, index = 0) {
    const src = part.src
    const options = {
      mpx: true,
      type,
      index,
      ...extraOptions
    }

    switch (type) {
      case 'json':
        options.asScript = true
      // eslint-disable-next-line no-fallthrough
      case 'styles':
      case 'template':
        options.extract = true
    }

    if (part.mode) options.mode = part.mode

    if (src) {
      return loaderUtils.stringifyRequest(loaderContext, addQuery(src, options, true))
    } else {
      const fakeRequest = getFakeRequest(type, part)
      const request = `${selectorPath}!${addQuery(rawRequest, options, true)}`
      return loaderUtils.stringifyRequest(loaderContext, `${fakeRequest}!=!${request}`)
    }
  }

  return {
    getRequire,
    getImport,
    getNamedExports,
    getRequestString
  }
}
