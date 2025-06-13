const normalize = require('../utils/normalize')
const optionProcessorPath = normalize.lib('runtime/optionProcessorReact')
const { buildPagesMap, buildComponentsMap, getRequireScript, buildGlobalParams, stringifyRequest } = require('./script-helper')

module.exports = function (script, {
  loaderContext,
  ctorType,
  srcMode,
  moduleId,
  isProduction,
  jsonConfig,
  outputPath,
  builtInComponentsMap,
  localComponentsMap,
  localPagesMap,
  rnConfig,
  componentGenerics,
  genericsInfo
}, callback) {
  const { appInfo } = loaderContext.getMpx()

  let scriptSrcMode = srcMode
  if (script) {
    scriptSrcMode = script.mode || scriptSrcMode
  } else {
    script = { tag: 'script' }
  }

  let hasApp = true

  if (!appInfo.name) {
    hasApp = false
  }

  let output = '/* script */\n'
  output += "import { lazy, createElement, memo, forwardRef } from 'react'\n"
  if (ctorType === 'app') {
    output += `
import { getComponent } from ${stringifyRequest(loaderContext, optionProcessorPath)}
\n`
    const { pagesMap, firstPage } = buildPagesMap({
      localPagesMap,
      loaderContext,
      jsonConfig,
      rnConfig
    })
    const componentsMap = buildComponentsMap({
      localComponentsMap,
      loaderContext,
      jsonConfig
    })
    output += buildGlobalParams({ moduleId, scriptSrcMode, loaderContext, isProduction, ctorType, jsonConfig, componentsMap, pagesMap, firstPage, hasApp })
    output += getRequireScript({ ctorType, script, loaderContext })
    output += `export default global.__mpxOptionsMap[${JSON.stringify(moduleId)}]\n`
  } else {
    output += `import { getComponent } from ${stringifyRequest(loaderContext, optionProcessorPath)}\n`
    // 获取组件集合
    const componentsMap = buildComponentsMap({
      localComponentsMap,
      builtInComponentsMap,
      loaderContext,
      jsonConfig
    })

    output += buildGlobalParams({ moduleId, scriptSrcMode, loaderContext, isProduction, ctorType, jsonConfig, componentsMap, outputPath, genericsInfo, componentGenerics })
    output += getRequireScript({ ctorType, script, loaderContext })
    output += `export default global.__mpxOptionsMap[${JSON.stringify(moduleId)}]\n`
  }

  callback(null, {
    output
  })
}
