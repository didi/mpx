const genComponentTag = require('../utils/gen-component-tag')
const loaderUtils = require('loader-utils')
const optionProcessorPath = require.resolve('../runtime/optionProcessor')

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

  const stringifyRequest = r => loaderUtils.stringifyRequest(loaderContext, r)

  let output = '/* script */\n'

  let scriptSrcMode = srcMode
  if (script) {
    scriptSrcMode = script.mode || scriptSrcMode
  } else {
    script = {
      type: 'script',
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
      // 目前ts模式都建议使用src来引ts，转出来后会变成
      delete attrs.lang
      return attrs
    },
    content (script) {
      let content = `import processOption, { getComponent } from ${stringifyRequest(optionProcessorPath)}\n`
      // add import
      if (ctorType === 'app') {
        content += `
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
        global.__networkTimeout = ${JSON.stringify(jsonConfig.networkTimeout)}
        global.__tabBar = ${JSON.stringify(jsonConfig.tabBar)}
        global.__mpxPageConfig = ${JSON.stringify(jsonConfig.window)}\n`

        if (i18n) {
          const i18nObj = Object.assign({}, i18n)
          content += `
        import VueI18n from 'vue-i18n'
        Vue.use(VueI18n)\n`
          const requestObj = {}
          const i18nKeys = ['messages', 'dateTimeFormats', 'numberFormats']
          i18nKeys.forEach((key) => {
            if (i18nObj[`${key}Path`]) {
              requestObj[key] = stringifyRequest(i18nObj[`${key}Path`])
              delete i18nObj[`${key}Path`]
            }
          })
          content += `const i18n = ${JSON.stringify(i18nObj)}\n`
          Object.keys(requestObj).forEach((key) => {
            content += `i18n.${key} = require(${requestObj[key]})\n`
          })
        }
      }
      let firstPage = ''
      const pagesMap = {}
      const componentsMap = {}
      Object.keys(localPagesMap).forEach((pagePath) => {
        const pageCfg = localPagesMap[pagePath]
        const pageRequest = stringifyRequest(pageCfg.resource)
        if (pageCfg.async) {
          pagesMap[pagePath] = `()=>import(${pageRequest})`
        } else {
          // 为了保持小程序中app->page->component的js执行顺序，所有的page和component都改为require引入
          pagesMap[pagePath] = `getComponent(require(${pageRequest}))`
        }
        if (pageCfg.isFirst) {
          firstPage = pagePath
        }
      })

      Object.keys(localComponentsMap).forEach((componentName) => {
        const componentCfg = localComponentsMap[componentName]
        const componentRequest = stringifyRequest(componentCfg.resource)
        if (componentCfg.async) {
          componentsMap[componentName] = `()=>import(${componentRequest})`
        } else {
          componentsMap[componentName] = `getComponent(require(${componentRequest}))`
        }
      })

      Object.keys(builtInComponentsMap).forEach((componentName) => {
        const componentCfg = builtInComponentsMap[componentName]
        const componentRequest = stringifyRequest(componentCfg.resource)
        componentsMap[componentName] = `getComponent(require(${componentRequest}), true)`
      })

      content += `global.currentSrcMode = ${JSON.stringify(scriptSrcMode)};\n`
      if (!isProduction) {
        content += `global.currentResource = ${JSON.stringify(loaderContext.resourcePath)};\n`
      }
      // 为了正确获取currentSrcMode便于运行时进行转换，对于src引入的组件script采用require方式引入(由于webpack会将import的执行顺序上升至最顶),这意味着对于src引入脚本中的named export将不会生效，不过鉴于mpx和小程序中本身也没有在组件script中声明export的用法，所以应该没有影响
      content += script.src
        ? (getRequireForSrc('script', script) + '\n')
        : (script.content + '\n') + '\n'
      // 配置平台转换通过createFactory在core中convertor中定义和进行
      // 通过processOption进行组件注册和路由注入
      const pureJsonConfig = {}
      if (ctorType === 'page') {
        const uselessOptions = new Set([
          'usingComponents',
          'style',
          'singlePage'
        ])
        Object.keys(jsonConfig)
          .filter(key => !uselessOptions.has(key))
          .forEach(key => {
            pureJsonConfig[key] = jsonConfig[key]
          })
      }
      content += `export default processOption(
        global.currentOption,
        ${JSON.stringify(ctorType)},
        ${JSON.stringify(firstPage)},
        ${JSON.stringify(mpxCid)},
        ${JSON.stringify(pureJsonConfig)},
        ${shallowStringify(pagesMap)},
        ${shallowStringify(componentsMap)}`

      if (ctorType === 'app') {
        content += `,
            Vue,
            VueRouter`
        if (i18n) {
          content += `,
            VueI18n,
            i18n`
        }
      }
      content += `
          )\n`
      return content
    }
  })
  output += '\n'

  callback(null, {
    output
  })
}
