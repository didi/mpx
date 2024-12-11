const async = require('async')
const processJSON = require('./processJSON')
// const processMainScript = require('./processMainScript')
const processTemplate = require('./processTemplate')
const processStyles = require('./processStyles')
const processScript = require('./processScript')
const RecordLoaderContentDependency = require('../dependencies/RecordLoaderContentDependency')
const {stringifyRequest} = require('./script-helper')
const addQuery = require('../utils/add-query')
const parseRequest = require('../utils/parse-request')



module.exports = function ({
  parts,
  jsonContent,
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
  usingComponentsInfo,
  componentGenerics,
  autoScope,
  callback
}) {

  let output = ''


  const mpx = loaderContext.getMpx()
  // const hasComment = parts.template && parts.template.attrs && parts.template.attrs.comments
  // const isNative = false
  const mode = mpx.mode
  // const srcMode = mpx.srcMode
  const env = mpx.env
  const defs = mpx.defs
  const resolveMode = mpx.resolveMode
  // const pagesMap = mpx.pagesMap
  const projectRoot = mpx.projectRoot

  // 通过RecordLoaderContentDependency和loaderContentCache确保子request不再重复生成loaderContent
  const cacheContent = mpx.loaderContentCache.get(loaderContext.resourcePath)
  if (cacheContent) return callback(null, cacheContent)
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
            usingComponentsInfo,
            componentGenerics
          }, callback)
        },
        (callback) => {
          processStyles(parts.styles, {
            ctorType,
            autoScope,
            moduleId
          }, callback)
        },
        (callback) => {
          processJSON(jsonContent, {
            mode,
            env,
            defs,
            resolveMode,
            loaderContext,
            pagesMap,
            pathHash: mpx.pathHash,
            componentsMap,
            projectRoot
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
        localPagesMap: jsonRes.localPagesMap,
        genericsInfo: templateRes.genericsInfo,
        wxsModuleMap: templateRes.wxsModuleMap,
        localComponentsMap: jsonRes.localComponentsMap
      }, callback)
    }
  ], (err, scriptRes) => {
    if (err) return callback(err)
    output += scriptRes.output
    loaderContext._module.addPresentationalDependency(new RecordLoaderContentDependency(loaderContext.resourcePath, output))
    callback(null, output)
  })
}
