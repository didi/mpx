const processJSON = require('./processJSON')
const processScript = require('./processScript')
const processStyles = require('./processStyles')
const processTemplate = require('./processTemplate')

const async = require('async')


module.exports = function ({
  mpx,
  loaderContext,
  isProduction,
  parts,
  ctorType,
  filePath,
  queryObj,
  autoScope,
  componentsMap,
  projectRoot,
  getRequireForSrc,
  vueContentCache,
  moduleId,
  callback
}) {
  const hasComment = parts.template && parts.template.attrs && parts.template.attrs.comments
  const isNative = false
  const mode = mpx.mode
  const srcMode = mpx.srcMode
  const env = mpx.env
  const defs = mpx.defs
  const resolveMode = mpx.resolveMode
  const pagesMap = mpx.pagesMap

  let output = ''
  let usingComponents = [].concat(Object.keys(mpx.usingComponents))

  return async.waterfall([
    (callback) => {
      async.parallel([
        (callback) => {
          processTemplate(parts.template, {
            hasComment,
            isNative,
            mode,
            srcMode,
            defs,
            loaderContext,
            moduleId,
            ctorType,
            usingComponents,
            decodeHTMLText: mpx.decodeHTMLText,
            externalClasses: mpx.externalClasses,
            checkUsingComponents: mpx.checkUsingComponents
          }, callback)
        },
        (callback) => {
          processStyles(parts.styles, {
            ctorType,
            autoScope
          }, callback)
        },
        (callback) => {
          processJSON(parts.json, {
            mode,
            env,
            defs,
            resolveMode,
            loaderContext,
            pagesMap,
            pagesEntryMap: mpx.pagesEntryMap,
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
      if (ctorType === 'app' && jsonRes.jsonObj.window && jsonRes.jsonObj.window.navigationBarTitleText) {
        mpx.appTitle = jsonRes.jsonObj.window.navigationBarTitleText
      }

      processScript(parts.script, {
        ctorType,
        srcMode,
        loaderContext,
        isProduction,
        getRequireForSrc,
        projectRoot,
        jsonConfig: jsonRes.jsonObj,
        componentId: queryObj.componentId || '',
        builtInComponentsMap: templateRes.builtInComponentsMap,
        localComponentsMap: jsonRes.localComponentsMap,
        localPagesMap: jsonRes.localPagesMap,
        forceDisableBuiltInLoader: mpx.forceDisableBuiltInLoader
      }, callback)
    }
  ], (err, scriptRes) => {
    if (err) return callback(err)
    output += scriptRes.output
    vueContentCache.set(filePath, output)
    callback(null, output)
  })
}