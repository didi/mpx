const loaderUtils = require('loader-utils')
const addQuery = require('../utils/add-query')
const parseRequest = require('../utils/parse-request')
const { matchCondition } = require('../utils/match-condition')
const templateCompiler = require('../template-compiler/compiler')
const { getWxTemplateComponentName, serializeWxTemplateDefinition, buildWebTemplateImportMergeExpr } = require('./template-shared')
const { compileTemplateFragment, wrapCreateTemplateComponentWithBlock } = require('./compile-wx-template-fragment')
const normalize = require('../utils/normalize')
const optionProcessorPath = normalize.lib('runtime/optionProcessor')

module.exports = function (content) {
  const loaderContext = this
  const isProduction = loaderContext.mode === 'production'
  const mpx = loaderContext.getMpx()

  const {
    projectRoot,
    mode,
    srcMode,
    env,
    defs,
    wxsContentMap,
    decodeHTMLText,
    externalClasses,
    autoVirtualHostRules,
    forceProxyEventRules,
    checkUsingComponentsRules,
    globalComponents,
    webConfig
  } = mpx

  const { resourcePath, rawResourcePath, queryObj } = parseRequest(loaderContext.resource)

  const warn = (msg) => {
    loaderContext.emitWarning(
      new Error('[Mpx template warning][' + loaderContext.resource + ']: ' + msg)
    )
  }
  const error = (msg) => {
    loaderContext.emitError(
      new Error('[Mpx template error][' + loaderContext.resource + ']: ' + msg)
    )
  }

  const { meta } = templateCompiler.parse(content, {
    warn,
    error,
    mode,
    srcMode: queryObj.srcMode || srcMode,
    env,
    defs,
    decodeHTMLText,
    externalClasses,
    filePath: rawResourcePath,
    i18n: null,
    globalComponents: Object.keys(globalComponents || {}),
    hasVirtualHost: matchCondition(resourcePath, autoVirtualHostRules),
    forceProxyEvent: matchCondition(resourcePath, forceProxyEventRules),
    checkUsingComponents: matchCondition(resourcePath, checkUsingComponentsRules),
    customBuiltInComponents: webConfig && webConfig.customBuiltInComponents
  })

  if (meta.wxsContentMap && wxsContentMap) {
    for (const module in meta.wxsContentMap) {
      wxsContentMap[`${rawResourcePath}~${module}`] = meta.wxsContentMap[module]
    }
  }

  const builtInPaths = meta.builtInComponentsMap || {}
  const builtInEntries = []
  Object.keys(builtInPaths).forEach((name) => {
    const request = addQuery(builtInPaths[name], { isComponent: true })
    const req = loaderUtils.stringifyRequest(loaderContext, request)
    builtInEntries.push(`${JSON.stringify(name)}: getComponent(require(${req}), {__mpxBuiltIn: true})`)
  })
  const builtInComponentsExpr = `{${builtInEntries.join(',')}}`

  // 处理 imports：与 web/processTemplate、react/processTemplate 一致（urlToRequest + !!template-loader）
  const importExprs = []
  if (meta.imports) {
    meta.imports.forEach((importSrc) => {
      importExprs.push(buildWebTemplateImportMergeExpr(loaderContext, importSrc, projectRoot))
    })
  }

  // 收集本 wxml 内声明的 wxs 模块，供其定义的模版组件使用
  const wxsInitLines = []
  if (meta.wxsModuleMap) {
    Object.keys(meta.wxsModuleMap).forEach((module) => {
      const src = loaderUtils.urlToRequest(meta.wxsModuleMap[module], projectRoot)
      wxsInitLines.push(`  __wxsModules[${JSON.stringify(module)}] = require(${loaderUtils.stringifyRequest(loaderContext, src)});`)
    })
  }

  // 处理本地 template 定义
  const localEntries = []
  if (meta.templates) {
    Object.keys(meta.templates).forEach((name) => {
      const tplNode = meta.templates[name]
      const tpl = serializeWxTemplateDefinition(tplNode, error, name)
      const compiled = compileTemplateFragment(tpl, {
        emitError: error,
        definitionName: name,
        resourcePath: rawResourcePath,
        isProduction
      })
      const compName = getWxTemplateComponentName(name)
      const inner = `name: ${JSON.stringify(compName)}, components: Object.assign({}, ${builtInComponentsExpr}), wxsModules: __wxsModules`
      localEntries.push(`${JSON.stringify(compName)}: ${wrapCreateTemplateComponentWithBlock(compiled.block, inner)}`)
    })
  }
  const localMapExpr = `{${localEntries.join(',')}}`

  const output = `
    var __optionProcessor = require(${loaderUtils.stringifyRequest(loaderContext, optionProcessorPath)});
    var getComponent = __optionProcessor.getComponent;
    var createTemplateComponent = __optionProcessor.createTemplateComponent;
    var __wxsModules = {};
${wxsInitLines.join('\n')}
    module.exports = Object.assign({}, ${[...importExprs, localMapExpr].join(', ')});
  `
  return output
}
