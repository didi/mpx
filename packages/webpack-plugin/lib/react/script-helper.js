const loaderUtils = require('loader-utils')
const createHelpers = require('../helpers')
const parseRequest = require('../utils/parse-request')
const shallowStringify = require('../utils/shallow-stringify')
const normalize = require('../utils/normalize')
const addQuery = require('../utils/add-query')

function stringifyRequest (loaderContext, request) {
  return loaderUtils.stringifyRequest(loaderContext, request)
}

function getMpxComponentRequest (component) {
  return JSON.stringify(addQuery(`@mpxjs/webpack-plugin/lib/runtime/components/react/dist/${component}`, { isComponent: true }))
}

const mpxAsyncContainer = getMpxComponentRequest('AsyncContainer')

function getAsyncChunkName (chunkName) {
  if (chunkName && typeof chunkName !== 'boolean') {
    return `/* webpackChunkName: "${chunkName}/index" */`
  }
  return ''
}

function getAsyncComponent (componentName, componentRequest, chunkName, fallback) {
  return `getComponent(memo(forwardRef(function(props, ref) {
    const _props = Object.assign({}, props, { ref })
    return createElement(
      getComponent(require(${mpxAsyncContainer})),
      {
        type: 'component',
        fallback: createElement(
          getComponent(require(${fallback})),
          _props
        )
      },
      createElement(
        getComponent(
          lazy(function(){ return import(${getAsyncChunkName(chunkName)}${componentRequest}) }), { displayName: ${JSON.stringify(componentName)} }
        ),
        _props
      )
    )
  })))`
}

function getAsyncPage (componentName, componentRequest, chunkName, fallback, loading) {
  fallback = fallback && `getComponent(require('${fallback}?isComponent=true'))`
  loading = loading && `getComponent(require('${loading}?isComponent=true'))`
  return `getComponent(function(props) {
    return createElement(
      getComponent(require(${mpxAsyncContainer})),
      {
        type: 'page',
        fallback: ${fallback},
        loading: ${loading}
      },
      () => createElement(
        getComponent(
          lazy(function(){ return import(${getAsyncChunkName(chunkName)}${componentRequest}) }), { __mpxPageRoute: ${JSON.stringify(componentName)}, displayName: 'Page' }
        ),
        props
      )
    )
  })`
}

function buildPagesMap ({ localPagesMap, loaderContext, jsonConfig, rnConfig }) {
  let firstPage = ''
  const pagesMap = {}
  Object.keys(localPagesMap).forEach((pagePath) => {
    const pageCfg = localPagesMap[pagePath]
    const pageRequest = stringifyRequest(loaderContext, pageCfg.resource)
    if (pageCfg.async) {
      pagesMap[pagePath] = getAsyncPage(pagePath, pageRequest, pageCfg.async, rnConfig.asyncChunk && rnConfig.asyncChunk.fallback, rnConfig.asyncChunk && rnConfig.asyncChunk.loading)
    } else {
    // 为了保持小程序中app->page->component的js执行顺序，所有的page和component都改为require引入
      pagesMap[pagePath] = `getComponent(require(${pageRequest}), {__mpxPageRoute: ${JSON.stringify(pagePath)}, displayName: "Page"})`
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
  if (localComponentsMap) {
    Object.keys(localComponentsMap).forEach((componentName) => {
      const componentCfg = localComponentsMap[componentName]
      const componentRequest = stringifyRequest(loaderContext, componentCfg.resource)
      if (componentCfg.async) {
        if (jsonConfig.componentPlaceholder && jsonConfig.componentPlaceholder[componentName]) {
          const placeholder = jsonConfig.componentPlaceholder[componentName]
          if (localComponentsMap[jsonConfig.componentPlaceholder[componentName]]) {
            const placeholderCfg = localComponentsMap[placeholder]
            const placeholderRequest = stringifyRequest(loaderContext, placeholderCfg.resource)
            if (placeholderCfg.async) {
              loaderContext.emitWarning(
                new Error(`[json processor][${loaderContext.resource}]: componentPlaceholder ${placeholder} should not be a async component, please check!`)
              )
            }
            componentsMap[componentName] = getAsyncComponent(componentName, componentRequest, componentCfg.async, placeholderRequest)
          } else {
            const fallbackComponentRequest = `"${addQuery(`@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-${placeholder}`, { isComponent: true })}"`
            componentsMap[componentName] = getAsyncComponent(componentName, componentRequest, componentCfg.async, fallbackComponentRequest)
          }
        } else {
          loaderContext.emitWarning(
            new Error(`[json processor][${loaderContext.resource}]: ${componentName} has no componentPlaceholder, please check!`)
          )
          componentsMap[componentName] = getAsyncComponent(componentName, componentRequest, componentCfg.async)
        }
      } else {
        componentsMap[componentName] = `getComponent(require(${componentRequest}), {displayName: ${JSON.stringify(componentName)}})`
      }
    })
  }
  if (builtInComponentsMap) {
    Object.keys(builtInComponentsMap).forEach((componentName) => {
      const componentCfg = builtInComponentsMap[componentName]
      const componentRequest = stringifyRequest(loaderContext, componentCfg.resource)
      componentsMap[componentName] = `getComponent(require(${componentRequest}), {__mpxBuiltIn: true})`
    })
  }
  return componentsMap
}

function getRequireScript ({ script, ctorType, loaderContext }) {
  let content = '  /** script content **/\n'
  const { getRequire } = createHelpers(loaderContext)
  const { resourcePath, queryObj } = parseRequest(loaderContext.resource)
  const extraOptions = {
    ...script.src
      ? { ...queryObj, resourcePath }
      : null,
    ctorType,
    lang: script.lang || 'js'
  }
  content += `  ${getRequire('script', script, extraOptions)}\n`
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
  preloadRule,
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
global.__getAppComponents = function () {
  return ${shallowStringify(componentsMap)}
}
global.__preloadRule = ${JSON.stringify(preloadRule)}
global.currentInject.getPages = function () {
  return ${shallowStringify(pagesMap)}
}
global.currentInject.firstPage = ${JSON.stringify(firstPage)}\n`
  } else {
    if (!hasApp) {
      content += '  global.__mpxGenericsMap = global.__mpxGenericsMap || {}\n'
    }
    if (ctorType === 'page') {
      const pageConfig = Object.assign({}, jsonConfig)
      delete pageConfig.usingComponents
      content += `global.currentInject.pageConfig = ${JSON.stringify(pageConfig)}\n`
    }

    content += `

    function getComponents() {
      return ${shallowStringify(componentsMap)}
    }

    global.currentInject.getComponents = getComponents\n`
    if (genericsInfo) {
      content += `
        const genericHash = ${JSON.stringify(genericsInfo.hash)}\n
        global.__mpxGenericsMap[genericHash] = function (name) {
          return getComponents()[name]
        }
      \n`
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
