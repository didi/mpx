const addQuery = require('../utils/add-query')
const normalize = require('../utils/normalize')
const optionProcessorPath = normalize.lib('runtime/optionProcessor')
const { buildComponentsMap, buildPagesMap, getCurrentOption, buildGlobalParams, shallowStringify, stringifyRequest, buildI18n } = require('./script-helper')

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
  const { i18n, webConfig, useSSR } = loaderContext.getMpx()

  const { pagesMap, firstPage, globalTabBar } = buildPagesMap({ localPagesMap, loaderContext, tabBar, tabBarMap, tabBarStr })

  const componentsMap = buildComponentsMap({ localComponentsMap, loaderContext })

  const scriptSrcMode = script ? script.mode || srcMode : srcMode

  let output = `\n  import { processAppOption, getComponent } from ${stringifyRequest(loaderContext, optionProcessorPath)}
          import '@mpxjs/webpack-plugin/lib/runtime/base.styl'
          import Vue from 'vue'
          import VueRouter from 'vue-router'
          import Mpx from '@mpxjs/core'
          import App from ${stringifyRequest(loaderContext, addQuery(resource, { isApp: true }))}
          Vue.use(VueRouter)
  \n`

  if (i18n) {
    output += buildI18n({ i18n, loaderContext })
  }

  output += buildGlobalParams({ moduleId, scriptSrcMode, loaderContext, isProduction, jsonConfig, webConfig, isMain: true, globalTabBar })
  output += getCurrentOption({ ctorType, script, isMain: true, loaderContext, moduleId })
  output += `export default processAppOption({
                        option: currentOption,
                        App,
                        tabBarMap: ${JSON.stringify(tabBarMap)},
                        firstPage: ${JSON.stringify(firstPage)},
                        pagesMap: ${shallowStringify(pagesMap)},
                        componentsMap: ${shallowStringify(componentsMap)},
                        Vue,
                        VueRouter,
                        webConfig: ${JSON.stringify(webConfig)},
                        useSSR: ${useSSR}
                    })`

  callback(null, {
    output
  })
}
