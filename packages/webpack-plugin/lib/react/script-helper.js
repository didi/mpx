const loaderUtils = require('loader-utils')
const createHelpers = require('../helpers')
const parseRequest = require('../utils/parse-request')
const shallowStringify = require('../utils/shallow-stringify')

function stringifyRequest (loaderContext, request) {
  return loaderUtils.stringifyRequest(loaderContext, request)
}

function getAsyncChunkName (chunkName) {
  if (chunkName && typeof chunkName !== 'boolean') {
    return `/* webpackChunkName: "${chunkName}" */`
  }
  return ''
}

function buildComponentsMap ({ localComponentsMap, builtInComponentsMap, loaderContext, jsonConfig }) {
  const componentsMap = {}
  if (localComponentsMap) {
    Object.keys(localComponentsMap).forEach((componentName) => {
      const componentCfg = localComponentsMap[componentName]
      const componentRequest = stringifyRequest(loaderContext, componentCfg.resource)
      if (componentCfg.async) {
        componentsMap[componentName] = `lazy(function(){return import(${getAsyncChunkName(componentCfg.async)}${componentRequest}).then(function(res){return getComponent(res)})})`
      } else {
        componentsMap[componentName] = `getComponent(require(${componentRequest}))`
      }
    })
  }
  if (builtInComponentsMap) {
    Object.keys(builtInComponentsMap).forEach((componentName) => {
      const componentCfg = builtInComponentsMap[componentName]
      const componentRequest = stringifyRequest(loaderContext, componentCfg.resource)
      componentsMap[componentName] = `getComponent(require(${componentRequest}), {__mpxBuiltIn: true})`
    })
  }
  return componentsMap
}

function getRequireScript ({ script, ctorType, loaderContext }) {
  let content = '  /** script content **/\n'
  const { getRequire } = createHelpers(loaderContext)
  const { resourcePath, queryObj } = parseRequest(loaderContext.resource)
  const extraOptions = {
    ...script.src
      ? { ...queryObj, resourcePath }
      : null,
    ctorType,
    lang: script.lang || 'js'
  }
  content += `  ${getRequire('script', script, extraOptions)}\n`
  return content
}

function buildGlobalParams ({
  moduleId,
  scriptSrcMode,
  loaderContext,
  isProduction,
  componentsMap
}) {
  let content = ''
  content += `global.currentModuleId = ${JSON.stringify(moduleId)}\n`
  content += `global.currentSrcMode = ${JSON.stringify(scriptSrcMode)}\n`
  content += `global.currentInject.components = ${shallowStringify(componentsMap)}\n`
  if (!isProduction) {
    content += `global.currentResource = ${JSON.stringify(loaderContext.resourcePath)}\n`
  }
  return content
}

module.exports = {
  buildComponentsMap,
  getRequireScript,
  buildGlobalParams,
  stringifyRequest
}
