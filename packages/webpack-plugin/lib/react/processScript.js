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
  if (ctorType === 'app') {
    output += `
import { getComponent } from ${stringifyRequest(loaderContext, optionProcessorPath)}
\n`
    const { pagesMap, firstPage } = buildPagesMap({
      localPagesMap,
      loaderContext,
      jsonConfig
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
    // RN环境暂不支持异步加载
    // output += 'import { lazy } from \'react\'\n'
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
