const genComponentTag = require('../utils/gen-component-tag')
const loaderUtils = require('loader-utils')
const normalize = require('../utils/normalize')
const shallowStringify = require('../utils/shallow-stringify')
const optionProcessorPath = normalize.lib('runtime/optionProcessor')
const async = require('async')
const createJSONHelper = require('../json-compiler/helper')
const addQuery = require('../utils/add-query')



const {
  buildComponentsMap,
  getRequireScript,
  buildGlobalParams,
  stringifyRequest
} = require('./script-helper')

module.exports = function (script, {
  loaderContext,
  ctorType,
  srcMode,
  moduleId,
  isProduction,
  componentGenerics,
  jsonConfig,
  outputPath,
  builtInComponentsMap,
  genericsInfo,
  wxsModuleMap,
  localComponentsMap,
  localPagesMap
}, callback) {
  const { projectRoot, appInfo, webConfig } = loaderContext.getMpx()


  // add entry
  // const checkEntryDeps = (callback) => {
  //   callback = callback || cacheCallback
  //   if (callback && entryDeps.size === 0) {
  //     callback()
  //   } else {
  //     cacheCallback = callback
  //   }
  // }

  // const addEntryDep = (context, resource, name) => {
  //   // 如果loader已经回调，就不再添加entry
  //   if (callbacked) return
  //   const dep = SingleEntryPlugin.createDependency(resource, name)
  //   entryDeps.add(dep)
  //   const virtualModule = new AddEntryDependency({
  //     context: context._compiler.context,
  //     dep,
  //     name
  //   })
  //   /* eslint-disable camelcase */
  //   context._module.__has_tenon_entry = true
  //   context._module.addDependency(virtualModule)
  //   entryDeps.delete(dep)
  //   checkEntryDeps()
  // }

  const emitWarning = (msg) => {
    loaderContext.emitWarning(
      new Error('[tenon script processor][' + loaderContext.resource + ']: ' + msg)
    )
  }

  const emitError = (msg) => {
    loaderContext.emitError(
      new Error('[tenon script processor][' + loaderContext.resource + ']: ' + msg)
    )
  }

  const {
    processPage,
    processDynamicEntry
  } = createJSONHelper({
    loaderContext,
    emitWarning,
    emitError
  })

  // const { getRequire } = createHelpers(loaderContext)

  // const stringifyRequest = r => loaderUtils.stringifyRequest(loaderContext, r)
  // let tabBarPagesMap = {}
  // if (tabBar && tabBarMap) {
  //   // 挂载tabBar组件
  //   const tabBarRequest = stringifyRequest(addQuery(tabBar.custom ? './custom-tab-bar/index' : tabBarPath, { component: true }))
  //   tabBarPagesMap['mpx-tab-bar'] = `getComponent(require(${tabBarRequest}))`
  //   // 挂载tabBar页面
  //   Object.keys(tabBarMap).forEach((pagePath) => {
  //     const pageCfg = localPagesMap[pagePath]
  //     if (pageCfg) {
  //       const pageRequest = stringifyRequest(pageCfg.resource)
  //       if (pageCfg.async) {
  //         tabBarPagesMap[pagePath] = `()=>import(${pageRequest}).then(res => getComponent(res, { __mpxPageRoute: ${JSON.stringify(pagePath)} }))`
  //       } else {
  //         tabBarPagesMap[pagePath] = `getComponent(require(${pageRequest}), { __mpxPageRoute: ${JSON.stringify(pagePath)} })`
  //       }
  //     } else {
  //       emitWarning(`TabBar page path ${pagePath} is not exist in local page map, please check!`)
  //     }
  //   })
  // }

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
      // script setup通过mpx处理，删除该属性避免vue报错
      delete attrs.setup
      return attrs
    },
    content (script) {
      let content = `\n  import { processComponentOption, getComponent, getWxsMixin } from ${stringifyRequest(loaderContext, optionProcessorPath)}\n`
      let hasApp = true
      if (!appInfo.name) {
        hasApp = false
      }


      // 获取组件集合
      const componentsMap = buildComponentsMap({ localComponentsMap, builtInComponentsMap, loaderContext, jsonConfig })

      // 获取pageConfig
      const pageConfig = {}
      if (ctorType === 'page') {
        Object.assign(pageConfig, jsonConfig)
        delete pageConfig.usingComponents
        // content += `import * as Tenon from '@hummer/tenon-vue'\n`
        // content += `var page = require(${stringifyRequest(loaderContext, addQuery(loaderContext.resource, { page: true }))}).default\n`
      }

      content += buildGlobalParams({ moduleId, scriptSrcMode, loaderContext, isProduction, webConfig, hasApp })
      content += getRequireScript({ ctorType, script, loaderContext })
      content += `
  export default processComponentOption({
    option: global.__mpxOptionsMap[${JSON.stringify(moduleId)}],
    ctorType: ${JSON.stringify(ctorType)},
    outputPath: ${JSON.stringify(outputPath)},
    pageConfig: ${JSON.stringify(pageConfig)},
    // @ts-ignore
    componentsMap: ${shallowStringify(componentsMap)},
    componentGenerics: ${JSON.stringify(componentGenerics)},
    genericsInfo: ${JSON.stringify(genericsInfo)},
    wxsMixin: null,
    hasApp: ${hasApp}
  })\n`

  content += '\n__dynamic_page_slot__\n'

      return content
    }
  })

  output += '\n'
  // 处理pages
  const pageSet = new Set()
  let dynamicPageStr = ''
  async.each(localPagesMap, (pageCfg, callback) => {
    if (typeof pageCfg !== 'string') pageCfg.src = addQuery(pageCfg.src, { tenon: true })
    processPage(pageCfg, loaderContext.context, '', (err, entry, { key } = {}) => {
      if (err) return callback()
      if (pageSet.has(key)) return callback()
      pageSet.add(key)
      dynamicPageStr += `\n"${entry}"`
      callback()
    })
  }, () => {
    output = output.replace('__dynamic_page_slot__', processDynamicEntry(dynamicPageStr) || '')
    callback(null, {
      output
    })
  })
}
