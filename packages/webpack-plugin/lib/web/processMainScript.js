// 该文件下的字符串语句需要使用 es5 语法
const addQuery = require('../utils/add-query')
const normalize = require('../utils/normalize')
const shallowStringify = require('../utils/shallow-stringify')
const optionProcessorPath = normalize.lib('runtime/optionProcessor')

const {
  buildComponentsMap,
  buildPagesMap,
  buildGlobalParams,
  stringifyRequest,
  buildI18n
} = require('./script-helper')

module.exports = function ({
  loaderContext,
  jsonConfig,
  localComponentsMap,
  tabBar,
  tabBarMap,
  tabBarStr,
  localPagesMap
}, callback) {
  const { i18n, webConfig, hasUnoCSS } = loaderContext.getMpx()
  const { pagesMap, firstPage, globalTabBar } = buildPagesMap({
    localPagesMap,
    loaderContext,
    tabBar,
    tabBarMap,
    tabBarStr,
    jsonConfig
  })

  const componentsMap = buildComponentsMap({
    localComponentsMap,
    loaderContext,
    jsonConfig
  })

  let output = 'import \'@mpxjs/webpack-plugin/lib/runtime/base.styl\'\n'
  // hasUnoCSS由@mpxjs/unocss-plugin注入
  if (hasUnoCSS) {
    output += 'import \'uno.css\'\n'
  }
  output += `import Vue from 'vue'
import VueRouter from 'vue-router'
import Mpx from '@mpxjs/core'
import { processAppOption, getComponent } from ${stringifyRequest(loaderContext, optionProcessorPath)}
Vue.use(VueRouter)\n`

  if (i18n) {
    output += buildI18n({ i18n, loaderContext })
  }

  output += buildGlobalParams({
    loaderContext,
    jsonConfig,
    webConfig,
    isMain: true,
    globalTabBar
  })

  output += `var App = require(${stringifyRequest(loaderContext, addQuery(loaderContext.resource, { isApp: true }))}).default\n`

  output += `
export default processAppOption({
  App: App,
  tabBarMap: ${JSON.stringify(tabBarMap)},
  firstPage: ${JSON.stringify(firstPage)},
  pagesMap: ${shallowStringify(pagesMap)},
  componentsMap: ${shallowStringify(componentsMap)},
  Vue: Vue,
  VueRouter: VueRouter,
  el: ${JSON.stringify(webConfig.el || '#app')}
})\n`

  callback(null, {
    output
  })
}
