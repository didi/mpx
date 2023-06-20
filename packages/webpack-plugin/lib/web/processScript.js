const genComponentTag = require('../utils/gen-component-tag')
const loaderUtils = require('loader-utils')
const addQuery = require('../utils/add-query')
const normalize = require('../utils/normalize')
const hasOwn = require('../utils/has-own')
const createHelpers = require('../helpers')
const optionProcessorPath = normalize.lib('runtime/optionProcessor')
const tabBarContainerPath = normalize.lib('runtime/components/web/mpx-tab-bar-container.vue')
const tabBarPath = normalize.lib('runtime/components/web/mpx-tab-bar.vue')

function shallowStringify (obj) {
  const arr = []
  for (const key in obj) {
    if (hasOwn(obj, key)) {
      let value = obj[key]
      if (Array.isArray(value)) {
        value = `[${value.join(',')}]`
      }
      arr.push(`'${key}':${value}`)
    }
  }
  return `{${arr.join(',')}}`
}

function getAsyncChunkName (chunkName) {
  if (chunkName && typeof chunkName !== 'boolean') {
    return `/* webpackChunkName: "${chunkName}" */`
  }
  return ''
}

module.exports = function (script, {
  loaderContext,
  ctorType,
  srcMode,
  moduleId,
  isProduction,
  componentGenerics,
  jsonConfig,
  outputPath,
  tabBarMap,
  tabBarStr,
  builtInComponentsMap,
  genericsInfo,
  wxsModuleMap,
  localComponentsMap,
  localPagesMap
}, callback) {
  const {
    i18n,
    projectRoot,
    webConfig,
    appInfo
  } = loaderContext.getMpx()
  const { getRequire } = createHelpers(loaderContext)
  const tabBar = jsonConfig.tabBar

  const emitWarning = (msg) => {
    loaderContext.emitWarning(
      new Error('[script processor][' + loaderContext.resource + ']: ' + msg)
    )
  }

  const stringifyRequest = r => loaderUtils.stringifyRequest(loaderContext, r)
  const tabBarPagesMap = {}
  if (tabBar && tabBarMap) {
    // 挂载tabBar组件
    const tabBarRequest = stringifyRequest(addQuery(tabBar.custom ? './custom-tab-bar/index' : tabBarPath, { isComponent: true }))
    tabBarPagesMap['mpx-tab-bar'] = `getComponent(require(${tabBarRequest}))`
    // 挂载tabBar页面
    Object.keys(tabBarMap).forEach((pagePath) => {
      const pageCfg = localPagesMap[pagePath]
      if (pageCfg) {
        const pageRequest = stringifyRequest(pageCfg.resource)
        if (pageCfg.async) {
          tabBarPagesMap[pagePath] = `()=>import(${getAsyncChunkName(pageCfg.async)}${pageRequest}).then(res => getComponent(res, { __mpxPageRoute: ${JSON.stringify(pagePath)} }))`
        } else {
          tabBarPagesMap[pagePath] = `getComponent(require(${pageRequest}), { __mpxPageRoute: ${JSON.stringify(pagePath)} })`
        }
      } else {
        emitWarning(`TabBar page path ${pagePath} is not exist in local page map, please check!`)
      }
    })
  }

  let output = '/* script */\n'

  let scriptSrcMode = srcMode
  if (script) {
    scriptSrcMode = script.mode || scriptSrcMode
  } else {
    script = { tag: 'script' }
  }
  output += genComponentTag(script, {
    attrs (script) {
      const attrs = Object.assign({}, script.attrs)
      // src改为内联require，删除
      delete attrs.src
      // script setup通过mpx处理，删除该属性避免vue报错
      delete attrs.setup
      return attrs
    },
    content (script) {
      let content = `\n  import processOption, { getComponent, getWxsMixin } from ${stringifyRequest(optionProcessorPath)}\n`
      // add import
      if (ctorType === 'app') {
        content += `  import '@mpxjs/webpack-plugin/lib/runtime/base.styl'
  import Vue from 'vue'
  import VueRouter from 'vue-router'
  import Mpx from '@mpxjs/core'
  Vue.use(VueRouter)
  global.getApp = function(){}
  global.getCurrentPages = function(){
    if(!global.__mpxRouter) return []
    // @ts-ignore
    return global.__mpxRouter.stack.map(item => {
      let page
      const vnode = item.vnode
      if(vnode && vnode.componentInstance) {
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
        if (i18n) {
          const i18nObj = Object.assign({}, i18n)
          content += `  import VueI18n from 'vue-i18n'
  import { createI18n } from 'vue-i18n-bridge'

  Vue.use(VueI18n , { bridge: true })\n`
          const requestObj = {}
          const i18nKeys = ['messages', 'dateTimeFormats', 'numberFormats']
          i18nKeys.forEach((key) => {
            if (i18nObj[`${key}Path`]) {
              requestObj[key] = stringifyRequest(i18nObj[`${key}Path`])
              delete i18nObj[`${key}Path`]
            }
          })
          content += `  const i18nCfg = ${JSON.stringify(i18nObj)}\n`
          Object.keys(requestObj).forEach((key) => {
            content += `  i18nCfg.${key} = require(${requestObj[key]})\n`
          })
          content += '  i18nCfg.legacy = false\n'
          content += `  const i18n = createI18n(i18nCfg, VueI18n)
  Vue.use(i18n)
  Mpx.i18n = i18n
  \n`
        }
      }
      let hasApp = true
      if (!appInfo.name) {
        hasApp = false
      }
      // 注入wxs模块
      content += '  const wxsModules = {}\n'
      if (wxsModuleMap) {
        Object.keys(wxsModuleMap).forEach((module) => {
          const src = loaderUtils.urlToRequest(wxsModuleMap[module], projectRoot)
          const expression = `require(${stringifyRequest(src)})`
          content += `  wxsModules.${module} = ${expression}\n`
        })
      }
      let firstPage = ''
      const pagesMap = {}
      const componentsMap = {}
      Object.keys(localPagesMap).forEach((pagePath) => {
        const pageCfg = localPagesMap[pagePath]
        const pageRequest = stringifyRequest(pageCfg.resource)
        if (tabBarMap && tabBarMap[pagePath]) {
          pagesMap[pagePath] = `getComponent(require(${stringifyRequest(tabBarContainerPath)}), { __mpxBuiltIn: true })`
        } else {
          if (pageCfg.async) {
            pagesMap[pagePath] = `()=>import(${getAsyncChunkName(pageCfg.async)} ${pageRequest}).then(res => getComponent(res, { __mpxPageRoute: ${JSON.stringify(pagePath)} }))`
          } else {
            // 为了保持小程序中app->page->component的js执行顺序，所有的page和component都改为require引入
            pagesMap[pagePath] = `getComponent(require(${pageRequest}), { __mpxPageRoute: ${JSON.stringify(pagePath)} })`
          }
        }

        if (pageCfg.isFirst) {
          firstPage = pagePath
        }
      })

      Object.keys(localComponentsMap).forEach((componentName) => {
        const componentCfg = localComponentsMap[componentName]
        const componentRequest = stringifyRequest(componentCfg.resource)
        if (componentCfg.async) {
          componentsMap[componentName] = `()=>import(${getAsyncChunkName(componentCfg.async)}${componentRequest}).then(res => getComponent(res))`
        } else {
          componentsMap[componentName] = `getComponent(require(${componentRequest}))`
        }
      })

      Object.keys(builtInComponentsMap).forEach((componentName) => {
        const componentCfg = builtInComponentsMap[componentName]
        const componentRequest = stringifyRequest(componentCfg.resource)
        componentsMap[componentName] = `getComponent(require(${componentRequest}), { __mpxBuiltIn: true })`
      })

      content += `  global.currentModuleId = ${JSON.stringify(moduleId)}\n`
      content += `  global.currentSrcMode = ${JSON.stringify(scriptSrcMode)}\n`
      content += `  global.currentInject = ${JSON.stringify({ moduleId })}\n`
      if (!isProduction) {
        content += `  global.currentResource = ${JSON.stringify(loaderContext.resourcePath)}\n`
      }

      content += '  /** script content **/\n'

      // 传递ctorType以补全js内容
      const extraOptions = {
        ctorType,
        lang: script.lang || 'js'
      }
      // todo 仅靠vueContentCache保障模块唯一性还是不够严谨，后续需要考虑去除原始query后构建request
      content += `  ${getRequire('script', script, extraOptions)}\n`

      // createApp/Page/Component执行完成后立刻获取当前的option并暂存
      content += `  const currentOption = global.__mpxOptionsMap[${JSON.stringify(moduleId)}]\n`
      // 获取pageConfig
      const pageConfig = {}
      if (ctorType === 'page') {
        const uselessOptions = new Set([
          'usingComponents',
          'style',
          'singlePage'
        ])
        Object.keys(jsonConfig)
          .filter(key => !uselessOptions.has(key))
          .forEach(key => {
            pageConfig[key] = jsonConfig[key]
          })
      }
      // 为了执行顺序正确，tabBarPagesMap在app逻辑执行完成后注入，保障小程序中app->page->component的js执行顺序
      if (tabBarStr && tabBarPagesMap) {
        content += `  global.__tabBar = ${tabBarStr}
  Vue.observable(global.__tabBar)
  // @ts-ignore
  global.__tabBarPagesMap = ${shallowStringify(tabBarPagesMap)}\n`
      }
      // 配置平台转换通过createFactory在core中convertor中定义和进行
      // 通过processOption进行组件注册和路由注入
      content += `  export default processOption(
    currentOption,
    ${JSON.stringify(ctorType)},
    ${JSON.stringify(firstPage)},
    ${JSON.stringify(outputPath)},
    ${JSON.stringify(pageConfig)},
    // @ts-ignore
    ${shallowStringify(pagesMap)},
    // @ts-ignore
    ${shallowStringify(componentsMap)},
    ${JSON.stringify(tabBarMap)},
    ${JSON.stringify(componentGenerics)},
    ${JSON.stringify(genericsInfo)},
    getWxsMixin(wxsModules),
    ${hasApp}`
      if (ctorType === 'app') {
        content += `,
    Vue,
    VueRouter`
      }
      content += '\n  )\n'
      return content
    }
  })
  output += '\n'

  callback(null, {
    output
  })
}
