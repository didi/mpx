const addQuery = require('../utils/add-query')
const normalize = require('../utils/normalize')
const optionProcessorPath = normalize.lib('runtime/optionProcessor')
const {
  buildComponentsMap,
  buildPagesMap,
  buildGlobalParams,
  shallowStringify,
  stringifyRequest,
  buildI18n
} = require('./script-helper')

module.exports = function (script, {
  loaderContext,
  ctorType,
  srcMode,
  moduleId,
  isProduction,
  jsonConfig,
  localComponentsMap,
  tabBar,
  tabBarMap,
  tabBarStr,
  localPagesMap,
  resource
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

  const componentsMap = buildComponentsMap({ localComponentsMap, loaderContext })

  const scriptSrcMode = script ? script.mode || srcMode : srcMode

  let output = '  import \'@mpxjs/webpack-plugin/lib/runtime/base.styl\'\n'
  // hasUnoCSS由@mpxjs/unocss-plugin注入
  if (hasUnoCSS) {
    output += '  import \'uno.css\'\n'
  }
  output += `  import Vue from 'vue'
  import VueRouter from 'vue-router'
  import Mpx from '@mpxjs/core'
  import { processAppOption, getComponent } from ${stringifyRequest(loaderContext, optionProcessorPath)}
  Vue.use(VueRouter)\n`

  if (i18n) {
    output += buildI18n({ i18n, loaderContext })
  }

  output += buildGlobalParams({
    moduleId,
    scriptSrcMode,
    loaderContext,
    isProduction,
    jsonConfig,
    webConfig,
    isMain: true,
    globalTabBar
  })

  output += `\n  var App = require(${stringifyRequest(loaderContext, addQuery(resource, { isApp: true }))}).default\n`

  output += `
  export default processAppOption({
    App,
    tabBarMap: ${JSON.stringify(tabBarMap)},
    firstPage: ${JSON.stringify(firstPage)},
    pagesMap: ${shallowStringify(pagesMap)},
    componentsMap: ${shallowStringify(componentsMap)},
    Vue,
    VueRouter,
    webConfig: ${JSON.stringify(webConfig)}
  })\n`

  callback(null, {
    output
  })
}
