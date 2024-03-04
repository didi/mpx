const async = require('async')
const processJSON = require('./processJSON')
const processTemplate = require('./processTemplate')
const processStyles = require('./processStyles')
const processScript = require('./processScript')
const RecordVueContentDependency = require('../dependencies/RecordVueContentDependency')

module.exports = function ({
  parts,
  loaderContext,
  pagesMap,
  componentsMap,
  queryObj,
  ctorType,
  srcMode,
  moduleId,
  isProduction,
  hasScoped,
  hasComment,
  isNative,
  usingComponents,
  componentGenerics,
  autoScope,
  callback
}) {
  const mpx = loaderContext.getMpx()
  // 通过RecordVueContentDependency和vueContentCache确保子request不再重复生成vueContent
  const cacheContent = mpx.vueContentCache.get(loaderContext.resourcePath)
  if (cacheContent) return callback(null, cacheContent)
  let output = ''
  return async.waterfall([
    (callback) => {
      async.parallel([
        (callback) => {
          processTemplate(parts.template, {
            loaderContext,
            hasScoped,
            hasComment,
            isNative,
            srcMode,
            moduleId,
            ctorType,
            usingComponents,
            componentGenerics
          }, callback)
        },
        (callback) => {
          processStyles(parts.styles, {
            loaderContext,
            ctorType,
            autoScope,
            moduleId
          }, callback)
        },
        (callback) => {
          processJSON(parts.json, {
            loaderContext,
            pagesMap,
            componentsMap
          }, callback)
        }
      ], (err, res) => {
        callback(err, res)
      })
    },
    ([templateRes, stylesRes, jsonRes], callback) => {
      output += templateRes.output
      output += stylesRes.output
      output += jsonRes.output
      processScript(parts.script, {
        loaderContext,
        ctorType,
        srcMode,
        moduleId,
        isProduction,
        componentGenerics,
        jsonConfig: jsonRes.jsonObj,
        outputPath: queryObj.outputPath || '',
        builtInComponentsMap: templateRes.builtInComponentsMap,
        genericsInfo: templateRes.genericsInfo,
        wxsModuleMap: templateRes.wxsModuleMap,
        localComponentsMap: jsonRes.localComponentsMap
      }, callback)
    }
  ], (err, scriptRes) => {
    if (err) return callback(err)
    output += scriptRes.output
    loaderContext._module.addPresentationalDependency(new RecordVueContentDependency(loaderContext.resourcePath, output))
    callback(null, output)
  })
}
