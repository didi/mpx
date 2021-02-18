const genComponentTag = require('../utils/gen-component-tag')
const loaderUtils = require('loader-utils')
const addQuery = require('../utils/add-query')
const normalize = require('../utils/normalize')
const builtInLoaderPath = normalize.lib('built-in-loader')
const optionProcessorPath = normalize.lib('runtime/optionProcessor')
const tabBarContainerPath = normalize.lib('runtime/components/web/mpx-tab-bar-container.vue')
const tabBarPath = normalize.lib('runtime/components/web/mpx-tab-bar.vue')

function shallowStringify (obj) {
  let arr = []
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      let value = obj[key]
      if (Array.isArray(value)) {
        value = `[${value.join(',')}]`
      }
      arr.push(`'${key}':${value}`)
    }
  }
  return `{${arr.join(',')}}`
}

module.exports = function (script, options, callback) {
  const ctorType = options.ctorType
  const builtInComponentsMap = options.builtInComponentsMap
  const localComponentsMap = options.localComponentsMap
  const localPagesMap = options.localPagesMap
  const srcMode = options.srcMode
  const loaderContext = options.loaderContext
  const isProduction = options.isProduction
  const mpxCid = options.mpxCid
  const getRequireForSrc = options.getRequireForSrc
  const i18n = options.i18n
  const jsonConfig = options.jsonConfig
  const tabBar = jsonConfig.tabBar
  const tabBarMap = options.tabBarMap
  const tabBarStr = options.tabBarStr
  const genericsInfo = options.genericsInfo
  const componentGenerics = options.componentGenerics
  const forceDisableBuiltInLoader = options.forceDisableBuiltInLoader

  const emitWarning = (msg) => {
    loaderContext.emitWarning(
      new Error('[script processor][' + loaderContext.resource + ']: ' + msg)
    )
  }

  const stringifyRequest = r => loaderUtils.stringifyRequest(loaderContext, r)
  let tabBarPagesMap = {}
  if (tabBar && tabBarMap) {
    // 挂载tabBar组件
    const tabBarRequest = stringifyRequest(addQuery(tabBar.custom ? './custom-tab-bar/index' : tabBarPath, { component: true }))
    tabBarPagesMap['mpx-tab-bar'] = `getComponent(require(${tabBarRequest}))`
    // 挂载tabBar页面
    Object.keys(tabBarMap).forEach((pagePath) => {
      const pageCfg = localPagesMap[pagePath]
      if (pageCfg) {
        const pageRequest = stringifyRequest(pageCfg.resource)
        if (pageCfg.async) {
          tabBarPagesMap[pagePath] = `()=>import(${pageRequest}).then(res => getComponent(res, { __mpxPageRoute: ${JSON.stringify(pagePath)} }))`
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
    script = {
      tag: 'script',
      content: ''
    }
    switch (ctorType) {
      case 'app':
        script.content = 'import {createApp} from "@mpxjs/core"\n' +
          'createApp({})\n'
        break
      case 'page':
        script.content = 'import {createPage} from "@mpxjs/core"\n' +
          'createPage({})\n'
        break
      case 'component':
        script.content = 'import {createComponent} from "@mpxjs/core"\n' +
          'createComponent({})\n'
    }
  }
  output += genComponentTag(script, {
    attrs (script) {
      const attrs = Object.assign({}, script.attrs)
      // src改为内联require，删除
      delete attrs.src
      // 目前ts模式都建议使用src来引ts，不支持使用lang内联编写ts
      // delete attrs.lang
      return attrs
    },
    content (script) {
      let content = `\n  import processOption, { getComponent } from ${stringifyRequest(optionProcessorPath)}\n`
      // add import
      if (ctorType === 'app') {
        content += `  import '@mpxjs/webpack-plugin/lib/runtime/base.styl'
  import Vue from 'vue'
  import VueRouter from 'vue-router'
  Vue.use(VueRouter)
  import BScroll from '@better-scroll/core'
  import PullDown from '@better-scroll/pull-down'
  import ObserveDOM from '@better-scroll/observe-dom'
  BScroll.use(ObserveDOM)
  BScroll.use(PullDown)
  global.BScroll = BScroll
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
  global.__style = ${JSON.stringify(jsonConfig.style || 'v1')}
  global.__mpxPageConfig = ${JSON.stringify(jsonConfig.window)}\n`

        if (i18n) {
          const i18nObj = Object.assign({}, i18n)
          content += `  import VueI18n from 'vue-i18n'
  Vue.use(VueI18n)\n`
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
          content += `  const i18n = new VueI18n(i18nCfg)
  if(global.__mpx) {
    global.__mpx.i18n = i18n
  }\n`
        }
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
            pagesMap[pagePath] = `()=>import(${pageRequest}).then(res => getComponent(res, { __mpxPageRoute: ${JSON.stringify(pagePath)} }))`
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
          componentsMap[componentName] = `()=>import(${componentRequest}).then(res => getComponent(res))`
        } else {
          componentsMap[componentName] = `getComponent(require(${componentRequest}))`
        }
      })

      Object.keys(builtInComponentsMap).forEach((componentName) => {
        const componentCfg = builtInComponentsMap[componentName]
        const componentRequest = forceDisableBuiltInLoader ? stringifyRequest(componentCfg.resource) : stringifyRequest('builtInComponent.vue!=!' + builtInLoaderPath + '!' + componentCfg.resource)
        componentsMap[componentName] = `getComponent(require(${componentRequest}), { __mpxBuiltIn: true })`
      })

      content += `  global.currentSrcMode = ${JSON.stringify(scriptSrcMode)}\n`
      if (!isProduction) {
        content += `  global.currentResource = ${JSON.stringify(loaderContext.resourcePath)}\n`
      }
      // 为了正确获取currentSrcMode便于运行时进行转换，对于src引入的组件script采用require方式引入(由于webpack会将import的执行顺序上升至最顶)，这意味着对于src引入脚本中的named export将不会生效，不过鉴于mpx和小程序中本身也没有在组件script中声明export的用法，所以应该没有影响
      content += script.src
        ? (getRequireForSrc('script', script) + '\n')
        : (script.content + '\n') + '\n'
      // createApp/Page/Component执行完成后立刻获取当前的option并暂存
      content += `  const currentOption = global.currentOption\n`
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
    ${JSON.stringify(mpxCid)},
    ${JSON.stringify(pageConfig)},
    // @ts-ignore
    ${shallowStringify(pagesMap)},
    // @ts-ignore
    ${shallowStringify(componentsMap)},
    ${JSON.stringify(tabBarMap)},
    ${JSON.stringify(componentGenerics)},
    ${JSON.stringify(genericsInfo)}`

      if (ctorType === 'app') {
        content += `,
    Vue,
    VueRouter`
        if (i18n) {
          content += `,
    i18n`
        }
      }
      content += `\n  )\n`
      return content
    }
  })
  output += '\n'

  callback(null, {
    output
  })
}
