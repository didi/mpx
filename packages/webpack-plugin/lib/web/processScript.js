const genComponentTag = require('../utils/gen-component-tag')
const loaderUtils = require('loader-utils')
const normalize = require('../utils/normalize')
const optionProcessorPath = normalize.lib('runtime/optionProcessor')
const wxmlTemplateLoader = normalize.lib('web/wxml-template-loader')
const { buildComponentsMap, getRequireScript, buildGlobalParams, shallowStringify } = require('./script-helper')

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
  templateSrcList,
  templateComponentMap,
  localComponentsMap
}, callback) {
  const { projectRoot, appInfo } = loaderContext.getMpx()

  const stringifyRequest = r => loaderUtils.stringifyRequest(loaderContext, r)

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
      let content = `\n  import { processComponentOption, getComponent, getWxsMixin } from ${stringifyRequest(optionProcessorPath)}\n`
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
      // const importTemplateMap = {}
      content += `const templateModules = {}\n`
      templateSrcList?.forEach((item) => {
        content += `
          const tempLoaderResult = require(${stringifyRequest(`!!${wxmlTemplateLoader}?context=${loaderContext.context}!${item}`)})\n
          Object.assign(templateModules, tempLoaderResult)\n`
        // content += `
        //   const tempLoaderResult = require(${stringifyRequest(`!!${wxmlTemplateLoader}?context=${loaderContext.context}!${item}`)})\n
        //   console.log(tempLoaderResult, 'test')\n
        //   Object.keys(tempLoaderResult).forEach((item) => {\n
        //     templateModules[item] = getComponent(require(tempLoaderResult[item]))\n
        //   })\n`
      })

      // 获取组件集合
      const componentsMap = buildComponentsMap({ localComponentsMap, builtInComponentsMap, loaderContext, jsonConfig })
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

      if (templateComponentMap) {
        Object.keys(templateComponentMap).forEach((name) => {
          const expression = `getComponent(require(${stringifyRequest(templateComponentMap[name])}))`
          componentsMap[name] = expression
        })
      }

      // content += `const templateComs = require('!!wxml-loader!xxx.wxml')`

      content += buildGlobalParams({ moduleId, scriptSrcMode, loaderContext, isProduction })
      content += getRequireScript({ ctorType, script, loaderContext })
      content += `
  export default processComponentOption({
    option: global.__mpxOptionsMap[${JSON.stringify(moduleId)}],
    ctorType: ${JSON.stringify(ctorType)},
    outputPath: ${JSON.stringify(outputPath)},
    pageConfig: ${JSON.stringify(pageConfig)},
    // @ts-ignore
    componentsMap: Object.assign(${shallowStringify(componentsMap)}, templateModules),
    componentGenerics: ${JSON.stringify(componentGenerics)},
    genericsInfo: ${JSON.stringify(genericsInfo)},
    wxsMixin: getWxsMixin(wxsModules),
    hasApp: ${hasApp}
  })\n`
      return content
    }
  })
  callback(null, {
    output
  })
}
