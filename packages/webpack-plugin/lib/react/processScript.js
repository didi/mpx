const normalize = require('../utils/normalize')
const optionProcessorPath = normalize.lib('runtime/optionProcessorReact')
const { buildPagesMap, buildComponentsMap, getRequireScript, buildGlobalParams, stringifyRequest, buildI18n } = require('./script-helper')

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
  const { appInfo, i18n } = loaderContext.getMpx()

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
  if (ctorType === 'app') {
    output += `
import { getComponent, getAsyncSuspense } from ${stringifyRequest(loaderContext, optionProcessorPath)}
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
      jsonConfig,
      rnConfig
    })
    output += buildGlobalParams({ moduleId, scriptSrcMode, loaderContext, isProduction, ctorType, jsonConfig, componentsMap, pagesMap, firstPage, hasApp })
    output += getRequireScript({ ctorType, script, loaderContext })
    output += `export default global.__mpxOptionsMap[${JSON.stringify(moduleId)}]\n`
  } else {
    output += `import { getComponent, getAsyncSuspense } from ${stringifyRequest(loaderContext, optionProcessorPath)}\n`
    // 获取组件集合
    const componentsMap = buildComponentsMap({
      localComponentsMap,
      builtInComponentsMap,
      loaderContext,
      jsonConfig,
      rnConfig
    })

    output += buildGlobalParams({ moduleId, scriptSrcMode, loaderContext, isProduction, ctorType, jsonConfig, componentsMap, outputPath, genericsInfo, componentGenerics, hasApp })
    if (!hasApp && i18n) {
      output += buildI18n({ loaderContext })
    }
    output += getRequireScript({ ctorType, script, loaderContext })

    output += `export default global.__mpxOptionsMap[${JSON.stringify(moduleId)}]\n`
  }

  callback(null, {
    output
  })
}
