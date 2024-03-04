const normalize = require('../utils/normalize')
const optionProcessorPath = normalize.lib('runtime/optionProcessor')
const { buildComponentsMap, getRequireScript, buildGlobalParams, stringifyRequest } = require('./script-helper')

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
  localComponentsMap
}, callback) {
  let scriptSrcMode = srcMode
  if (script) {
    scriptSrcMode = script.mode || scriptSrcMode
  } else {
    script = { tag: 'script' }
  }

  let output = '/* script */\n'
  output += 'import { lazy } from \'react\'\n'
  output += `import { getComponent } from ${stringifyRequest(loaderContext, optionProcessorPath)}\n`

  // 获取组件集合
  const componentsMap = buildComponentsMap({ localComponentsMap, builtInComponentsMap, loaderContext, jsonConfig })

  output += buildGlobalParams({ moduleId, scriptSrcMode, loaderContext, isProduction, componentsMap })
  output += getRequireScript({ ctorType, script, loaderContext })
  output += `export default global.__mpxOptionsMap[${JSON.stringify(moduleId)}]\n`

  callback(null, {
    output
  })
}
