const loaderUtils = require('loader-utils')
const normalize = require('../utils/normalize')
const createHelpers = require('../helpers')
const tabBarContainerPath = normalize.lib('runtime/components/web/mpx-tab-bar-container.vue')
const tabBarPath = normalize.lib('runtime/components/web/mpx-tab-bar.vue')
const addQuery = require('../utils/add-query')
const parseRequest = require('../utils/parse-request')
const shallowStringify = require('../utils/shallow-stringify')

function stringifyRequest (loaderContext, request) {
  return loaderUtils.stringifyRequest(loaderContext, request)
}

function getAsyncChunkName (chunkName) {
  if (chunkName && typeof chunkName !== 'boolean') {
    return `/* webpackChunkName: "${chunkName}/index" */`
  }
  return ''
}

function buildComponentsMap ({ localComponentsMap, builtInComponentsMap, loaderContext, jsonConfig }) {
  const componentsMap = {}
  if (localComponentsMap) {
    Object.keys(localComponentsMap).forEach((componentName) => {
      const componentCfg = localComponentsMap[componentName]
      const componentRequest = stringifyRequest(loaderContext, componentCfg.resource)

      if (componentCfg.async) {
        const placeholder = jsonConfig.componentPlaceholder && jsonConfig.componentPlaceholder[componentName]
        if (placeholder) {
          const placeholderCfg = localComponentsMap[placeholder]
          if (placeholderCfg) {
            if (placeholderCfg.async) {
              loaderContext.emitWarning(
                new Error(`[json processor][${loaderContext.resource}]: componentPlaceholder ${placeholder} should not be a async component, please check!`)
              )
            }
            componentsMap[componentName] = `function(){return {component: import(${getAsyncChunkName(componentCfg.async)}${componentRequest}).then(function(res){return getComponent(res)}), loading: componentsMap['${placeholder}']}}`
          } else {
            loaderContext.emitError(
              new Error(`[json processor][${loaderContext.resource}]: componentPlaceholder ${placeholder} is not built-in component or custom component, please check!`)
            )
            componentsMap[componentName] = `function(){return import(${getAsyncChunkName(componentCfg.async)}${componentRequest}).then(function(res){return getComponent(res)})}`
          }
        } else {
          loaderContext.emitError(
            new Error(`[json processor][${loaderContext.resource}]: ${componentName} has no componentPlaceholder, please check!`)
          )
          componentsMap[componentName] = `function(){return import(${getAsyncChunkName(componentCfg.async)}${componentRequest}).then(function(res){return getComponent(res)})}`
        }
      } else {
        componentsMap[componentName] = `getComponent(require(${componentRequest}))`
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

function buildPagesMap ({ localPagesMap, loaderContext, tabBar, tabBarMap, tabBarStr, jsonConfig }) {
  let globalTabBar = ''
  let firstPage = ''
  const pagesMap = {}
  const tabBarPagesMap = {}
  if (tabBar && tabBarMap) {
    // 挂载tabBar组件
    const tabBarRequest = stringifyRequest(loaderContext, addQuery(tabBar.custom ? './custom-tab-bar/index' : tabBarPath, { isComponent: true }))
    tabBarPagesMap['mpx-tab-bar'] = `getComponent(require(${tabBarRequest}))`
    // 挂载tabBar页面
    Object.keys(tabBarMap).forEach((pagePath) => {
      const pageCfg = localPagesMap[pagePath]
      if (pageCfg) {
        const pageRequest = stringifyRequest(loaderContext, pageCfg.resource)
        if (pageCfg.async) {
          tabBarPagesMap[pagePath] = `function(){return import(${getAsyncChunkName(pageCfg.async)}${pageRequest}).then(function(res) {return getComponent(res, {__mpxPageRoute: ${JSON.stringify(pagePath)}})})}`
        } else {
          tabBarPagesMap[pagePath] = `getComponent(require(${pageRequest}), {__mpxPageRoute: ${JSON.stringify(pagePath)}})`
        }
      } else {
        loaderContext.emitWarning(
          new Error(`[json processor][${loaderContext.resource}]: TabBar page path ${pagePath} is not exist in local page map, please check!`)
        )
      }
    })
  }
  if (tabBarStr && tabBarPagesMap) {
    globalTabBar += `
  global.__tabBar = ${tabBarStr}
  Vue.observable(global.__tabBar)
  // @ts-ignore
  global.__tabBarPagesMap = ${shallowStringify(tabBarPagesMap)}\n`
  }
  Object.keys(localPagesMap).forEach((pagePath) => {
    const pageCfg = localPagesMap[pagePath]
    const pageRequest = stringifyRequest(loaderContext, pageCfg.resource)
    if (tabBarMap && tabBarMap[pagePath]) {
      pagesMap[pagePath] = `getComponent(require(${stringifyRequest(loaderContext, tabBarContainerPath)}), {__mpxBuiltIn: true})`
    } else {
      if (pageCfg.async) {
        pagesMap[pagePath] = `function(){return import(${getAsyncChunkName(pageCfg.async)} ${pageRequest}).then(function(res){return getComponent(res, {__mpxPageRoute: ${JSON.stringify(pagePath)}})})}`
      } else {
        // 为了保持小程序中app->page->component的js执行顺序，所有的page和component都改为require引入
        pagesMap[pagePath] = `getComponent(require(${pageRequest}), {__mpxPageRoute: ${JSON.stringify(pagePath)}})`
      }
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
    firstPage,
    globalTabBar
  }
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
  jsonConfig,
  webConfig,
  isMain,
  globalTabBar,
  hasApp
}) {
  let content = ''
  if (isMain) {
    content += `
  global.getApp = function () {}
  global.getCurrentPages = function () {
    if (!(typeof window !== 'undefined')) {
      console.error('[Mpx runtime error]: Dangerous API! global.getCurrentPages is running in non browser environment, It may cause some problems, please use this method with caution')
    }
    var router = global.__mpxRouter
    if (!router) return []
    // @ts-ignore
    return (router.lastStack || router.stack).map(function (item) {
      var page
      var vnode = item.vnode
      if (vnode && vnode.componentInstance) {
        page = vnode.tag.endsWith('mpx-tab-bar-container') ? vnode.componentInstance.$refs.tabBarPage : vnode.componentInstance
      }
      return page || { route: item.path.slice(1) }
    })
  }
  global.__networkTimeout = ${JSON.stringify(jsonConfig.networkTimeout)}
  global.__mpxGenericsMap = {}
  global.__mpxOptionsMap = {}
  global.__style = ${JSON.stringify(jsonConfig.style || 'v1')}
  global.__mpxPageConfig = ${JSON.stringify(jsonConfig.window)}
  global.__mpxTransRpxFn = ${webConfig.transRpxFn}\n`
    if (globalTabBar) {
      content += globalTabBar
    }
  } else {
    if (!hasApp) {
      content += '  global.__mpxGenericsMap = global.__mpxGenericsMap || {}\n'
      content += '  global.__mpxOptionsMap = global.__mpxOptionsMap || {}\n'
      content += `  global.__mpxTransRpxFn = ${webConfig.transRpxFn}\n`
    }
    content += `  global.currentModuleId = ${JSON.stringify(moduleId)}\n`
    content += `  global.currentSrcMode = ${JSON.stringify(scriptSrcMode)}\n`
    content += `  global.currentInject = ${JSON.stringify({ moduleId })}\n`
    if (!isProduction) {
      content += `  global.currentResource = ${JSON.stringify(loaderContext.resourcePath)}\n`
    }
  }
  return content
}

function buildI18n ({ i18n, isMain, loaderContext }) {
  let i18nContent = ''
  const i18nObj = Object.assign({}, i18n)
  if (!isMain) {
    i18nContent += `import Vue from 'vue'
    import Mpx from '@mpxjs/core'\n`
  }
  i18nContent += `import VueI18n from 'vue-i18n'
  import { createI18n } from 'vue-i18n-bridge'
  if (!Mpx.i18n) {
    Vue.use(VueI18n , { bridge: true })\n`
  const requestObj = {}
  const i18nKeys = ['messages', 'dateTimeFormats', 'numberFormats']
  i18nKeys.forEach((key) => {
    if (i18nObj[`${key}Path`]) {
      requestObj[key] = stringifyRequest(loaderContext, i18nObj[`${key}Path`])
      delete i18nObj[`${key}Path`]
    }
  })
  i18nContent += `    var i18nCfg = ${JSON.stringify(i18nObj)}\n`
  Object.keys(requestObj).forEach((key) => {
    i18nContent += `    i18nCfg.${key} = require(${requestObj[key]})\n`
  })
  i18nContent += `
    i18nCfg.legacy = false
    var i18n = createI18n(i18nCfg, VueI18n)
    Vue.use(i18n)
    Mpx.i18n = i18n
  }\n`
  return i18nContent
}

module.exports = {
  buildPagesMap,
  buildComponentsMap,
  getRequireScript,
  buildGlobalParams,
  stringifyRequest,
  buildI18n
}
