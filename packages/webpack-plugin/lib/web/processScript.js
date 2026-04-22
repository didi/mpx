const genComponentTag = require('../utils/gen-component-tag')
const loaderUtils = require('loader-utils')
const normalize = require('../utils/normalize')
const shallowStringify = require('../utils/shallow-stringify')
const optionProcessorPath = normalize.lib('runtime/optionProcessor')
const {
  buildComponentsMap,
  getRequireScript,
  buildGlobalParams,
  stringifyRequest,
  buildI18n
} = require('./script-helper')
const { compileTemplateFragment, wrapCreateTemplateComponentWithBlock } = require('./compile-wx-template-fragment')

module.exports = function (script, {
  loaderContext,
  ctorType,
  srcMode,
  moduleId,
  hasScoped,
  isProduction,
  componentGenerics,
  jsonConfig,
  outputPath,
  builtInComponentsMap,
  genericsInfo,
  wxsModuleMap,
  wxTemplateComponentsInfo,
  localComponentsMap
}, callback) {
  const { projectRoot, appInfo, webConfig, i18n } = loaderContext.getMpx()

  const { disablePageTransition = true } = webConfig

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
      const isProduction = loaderContext.mode === 'production'
      const hasWxTemplate = !!(wxTemplateComponentsInfo &&
        ((wxTemplateComponentsInfo.imports && wxTemplateComponentsInfo.imports.length) ||
          (wxTemplateComponentsInfo.locals && wxTemplateComponentsInfo.locals.length)))
      const optionProcessorImports = ['processComponentOption', 'getComponent', 'getWxsMixin']
      if (hasWxTemplate) optionProcessorImports.push('createWxTemplateComponent')
      let content = `\n  import { ${optionProcessorImports.join(', ')} } from ${stringifyRequest(loaderContext, optionProcessorPath)}\n`
      let hasApp = true
      if (!appInfo.name) {
        hasApp = false
      }
      // 注入wxs模块
      content += '  var wxsModules = {}\n'
      if (wxsModuleMap) {
        Object.keys(wxsModuleMap).forEach((module) => {
          const src = loaderUtils.urlToRequest(wxsModuleMap[module], projectRoot)
          const expression = `require(${stringifyRequest(loaderContext, src)})`
          content += `  wxsModules.${module} = ${expression}\n`
        })
      }

      // 获取组件集合
      const componentsMap = buildComponentsMap({ localComponentsMap, builtInComponentsMap, loaderContext, jsonConfig })

      // 注入 wx template 子组件（<template name> / <import src>）
      let wxTemplateComponentsExpr = ''
      if (hasWxTemplate) {
        const parts = (wxTemplateComponentsInfo.imports || []).slice()
        const localsExprs = (wxTemplateComponentsInfo.locals || []).map((local) => {
          const emitError = (msg) => {
            loaderContext.emitError(new Error('[Mpx template error][' + loaderContext.resource + ']: ' + msg))
          }
          const compiled = compileTemplateFragment(local.template, {
            emitError,
            definitionName: local.name,
            resourcePath: loaderContext.resourcePath,
            isProduction
          })
          const inner = `name: ${JSON.stringify(local.name)}`
          return `${JSON.stringify(local.name)}: ${wrapCreateTemplateComponentWithBlock(compiled.block, inner)}`
        })
        if (localsExprs.length) {
          parts.push(`{${localsExprs.join(',')}}`)
        }
        wxTemplateComponentsExpr = `Object.assign({}, ${parts.join(', ')})`
        content += `  var wxTemplateComponentsMap = ${wxTemplateComponentsExpr}\n`
      }

      // 获取pageConfig
      const pageConfig = {}
      if (ctorType === 'page') {
        Object.assign(pageConfig, jsonConfig)
        delete pageConfig.usingComponents
      }

      content += buildGlobalParams({ moduleId, scriptSrcMode, loaderContext, isProduction, webConfig, hasApp })
      if (!hasApp && i18n) {
        content += buildI18n({ i18n, loaderContext })
      }
      content += getRequireScript({ ctorType, script, loaderContext })
      const componentsMapExpr = hasWxTemplate
        ? `Object.assign({}, ${shallowStringify(componentsMap)}, wxTemplateComponentsMap)`
        : shallowStringify(componentsMap)
      content += `
  // @ts-ignore
  export default processComponentOption({
    option: global.__mpxOptionsMap[${JSON.stringify(moduleId)}],
    ctorType: ${JSON.stringify(ctorType)},
    moduleId: ${JSON.stringify(moduleId)},
    hasScoped: ${JSON.stringify(!!hasScoped)},
    outputPath: ${JSON.stringify(outputPath)},
    pageConfig: ${JSON.stringify(pageConfig)},
    componentsMap: ${componentsMapExpr},
    componentGenerics: ${JSON.stringify(componentGenerics)},
    genericsInfo: ${JSON.stringify(genericsInfo)},
    wxsMixin: getWxsMixin(wxsModules),
    hasApp: ${hasApp},
    disablePageTransition: ${JSON.stringify(disablePageTransition)},
  })\n`
      return content
    }
  })

  callback(null, {
    output
  })
}
