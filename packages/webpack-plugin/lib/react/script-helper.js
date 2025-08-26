const loaderUtils = require('loader-utils')
const createHelpers = require('../helpers')
const parseRequest = require('../utils/parse-request')
const shallowStringify = require('../utils/shallow-stringify')
const normalize = require('../utils/normalize')
const addQuery = require('../utils/add-query')

function stringifyRequest (loaderContext, request) {
  return loaderUtils.stringifyRequest(loaderContext, request)
}

function getAsyncChunkName (chunkName) {
  if (chunkName && typeof chunkName !== 'boolean') {
    return `/* webpackChunkName: "${chunkName}/index" */`
  }
  return ''
}

function getAsyncSuspense (type, moduleId, componentRequest, componentName, chunkName, getFallback, getLoading) {
  return `getAsyncSuspense({
  type: ${JSON.stringify(type)},
  moduleId: ${JSON.stringify(moduleId)},
  chunkName: ${JSON.stringify(chunkName)},
  getFallback: ${getFallback},
  getLoading: ${getLoading},
  getChildren () {
    return import(${getAsyncChunkName(chunkName)}${componentRequest}).then(function (res) {
      return getComponent(res, {displayName: ${JSON.stringify(componentName)}})
    })
  }
})`
}

function getComponent (componentRequest, componentName) {
  return `getComponent(require(${componentRequest}), {displayName: ${JSON.stringify(componentName)}})`
}

function getBuiltInComponent (componentRequest) {
  return `getComponent(require(${componentRequest}), {__mpxBuiltIn: true})`
}

// function getLazyPage (componentRequest) {
//   return `getLazyPage(${getComponentGetter(getComponent(componentRequest, 'Page'))})`
// }

function getComponentGetter (component) {
  return `function(){ return ${component} }`
}

function buildPagesMap ({ localPagesMap, loaderContext, jsonConfig, rnConfig }) {
  let firstPage = ''
  const pagesMap = {}
  const mpx = loaderContext.getMpx()
  Object.keys(localPagesMap).forEach((pagePath) => {
    const pageCfg = localPagesMap[pagePath]
    const pageRequest = stringifyRequest(loaderContext, pageCfg.resource)
    if (pageCfg.async) {
      const moduleId = mpx.getModuleId(pageCfg.resource)
      const getFallback = rnConfig.asyncChunk && rnConfig.asyncChunk.fallback && getComponentGetter(getComponent(stringifyRequest(loaderContext, addQuery(rnConfig.asyncChunk.fallback, { isComponent: true })), 'PageFallback'))
      const getLoading = rnConfig.asyncChunk && rnConfig.asyncChunk.loading && getComponentGetter(getComponent(stringifyRequest(loaderContext, addQuery(rnConfig.asyncChunk.loading, { isComponent: true })), 'PageLoading'))
      pagesMap[pagePath] = getAsyncSuspense('page', moduleId, pageRequest, 'Page', pageCfg.async, getFallback, getLoading)
    } else {
      // 为了保持小程序中app->page->component的js执行顺序，所有的page和component都改为require引入
      pagesMap[pagePath] = getComponentGetter(getComponent(pageRequest, 'Page'))
    }
    if (pagePath === jsonConfig.entryPagePath) {
      firstPage = pagePath
    }
    if (!firstPage && pageCfg.isFirst) {
      firstPage = pagePath
    }
  })
  return {
    pagesMap,
    firstPage
  }
}

function buildComponentsMap ({ localComponentsMap, builtInComponentsMap, loaderContext, jsonConfig }) {
  const componentsMap = {}
  const mpx = loaderContext.getMpx()
  if (localComponentsMap) {
    Object.keys(localComponentsMap).forEach((componentName) => {
      const componentCfg = localComponentsMap[componentName]
      const componentRequest = stringifyRequest(loaderContext, componentCfg.resource)
      if (componentCfg.async) {
        const moduleId = mpx.getModuleId(componentCfg.resource)
        const placeholder = jsonConfig.componentPlaceholder && jsonConfig.componentPlaceholder[componentName]
        let getFallback
        if (placeholder) {
          if (localComponentsMap[placeholder]) {
            const placeholderCfg = localComponentsMap[placeholder]
            const placeholderRequest = stringifyRequest(loaderContext, placeholderCfg.resource)
            if (placeholderCfg.async) {
              loaderContext.emitWarning(
                new Error(`[json processor][${loaderContext.resource}]: componentPlaceholder ${placeholder} should not be a async component, please check!`)
              )
            }
            getFallback = getComponentGetter(getComponent(placeholderRequest, placeholder))
          } else {
            loaderContext.emitError(
              new Error(`[json processor][${loaderContext.resource}]: componentPlaceholder ${placeholder} is not built-in component or custom component, please check!`)
            )
          }
        } else {
          loaderContext.emitError(
            new Error(`[json processor][${loaderContext.resource}]: ${componentName} has no componentPlaceholder, please check!`)
          )
        }
        componentsMap[componentName] = getAsyncSuspense('component', moduleId, componentRequest, componentName, componentCfg.async, getFallback)
      } else {
        componentsMap[componentName] = getComponentGetter(getComponent(componentRequest, componentName))
      }
    })
  }
  if (builtInComponentsMap) {
    Object.keys(builtInComponentsMap).forEach((componentName) => {
      const componentCfg = builtInComponentsMap[componentName]
      const componentRequest = stringifyRequest(loaderContext, componentCfg.resource)
      componentsMap[componentName] = getComponentGetter(getBuiltInComponent(componentRequest))
    })
  }
  return componentsMap
}

function getRequireScript ({ script, ctorType, loaderContext }) {
  let content = '/** script content **/\n'
  const { getRequire } = createHelpers(loaderContext)
  const { resourcePath, queryObj } = parseRequest(loaderContext.resource)
  const extraOptions = {
    ...script.src
      ? { ...queryObj, resourcePath }
      : null,
    ctorType,
    lang: script.lang || 'js'
  }
  content += `${getRequire('script', script, extraOptions)}\n`
  return content
}

function buildGlobalParams ({
  moduleId,
  scriptSrcMode,
  loaderContext,
  isProduction,
  ctorType,
  jsonConfig,
  componentsMap,
  pagesMap,
  firstPage,
  outputPath,
  genericsInfo,
  hasApp
}) {
  let content = ''
  if (ctorType === 'app') {
    content += `
global.getApp = function () {}
global.getCurrentPages = function () { return [] }
global.__networkTimeout = ${JSON.stringify(jsonConfig.networkTimeout)}
global.__mpxGenericsMap = {}
global.__mpxOptionsMap = {}
global.__mpxPagesMap = {}
global.__style = ${JSON.stringify(jsonConfig.style || 'v1')}
global.__mpxPageConfig = ${JSON.stringify(jsonConfig.window)}
global.__appComponentsMap = ${shallowStringify(componentsMap)}
global.__preloadRule = ${JSON.stringify(jsonConfig.preloadRule)}
global.currentInject.pagesMap = ${shallowStringify(pagesMap)}
global.currentInject.firstPage = ${JSON.stringify(firstPage)}\n`
  } else {
    if (ctorType === 'page') {
      const pageConfig = Object.assign({}, jsonConfig)
      delete pageConfig.usingComponents
      content += `global.currentInject.pageConfig = ${JSON.stringify(pageConfig)}\n`
    }

    content += `
var componentsMap = ${shallowStringify(componentsMap)}
global.currentInject.componentsMap = componentsMap\n`
    if (genericsInfo) {
      if (!hasApp) {
        content += 'global.__mpxGenericsMap = global.__mpxGenericsMap || {}\n'
      }
      content += `
const genericHash = ${JSON.stringify(genericsInfo.hash)}\n
global.__mpxGenericsMap[genericHash] = componentsMap\n`
    }
    if (ctorType === 'component') {
      content += `global.currentInject.componentPath = '/' + ${JSON.stringify(outputPath)}\n`
    }
  }
  content += `global.currentModuleId = ${JSON.stringify(moduleId)}\n`
  content += `global.currentSrcMode = ${JSON.stringify(scriptSrcMode)}\n`
  if (!isProduction) {
    content += `global.currentResource = ${JSON.stringify(loaderContext.resourcePath)}\n`
  }
  return content
}

function buildI18n ({ loaderContext }) {
  const i18nWxsPath = normalize.lib('runtime/i18n.wxs')
  const i18nWxsLoaderPath = normalize.lib('wxs/i18n-loader.js')
  const i18nWxsRequest = i18nWxsLoaderPath + '!' + i18nWxsPath
  return `require(${stringifyRequest(loaderContext, i18nWxsRequest)})\n`
}

module.exports = {
  buildPagesMap,
  buildComponentsMap,
  getRequireScript,
  buildGlobalParams,
  stringifyRequest,
  buildI18n
}
