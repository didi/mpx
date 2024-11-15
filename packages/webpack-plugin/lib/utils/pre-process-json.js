const RecordGlobalComponentsDependency = require('../dependencies/RecordGlobalComponentsDependency')
const JSON5 = require('json5')
const isUrlRequest = require('./is-url-request')
const parseRequest = require('./parse-request')
const addQuery = require('./add-query')
const resolve = require('./resolve')
const getJSONContent = require('./get-json-content')
const getRulesRunner = require('../platform')
const async = require('async')

module.exports = function ({
  partsJSON,
  jsonContent,
  srcMode,
  emitWarning,
  emitError,
  ctorType,
  resourcePath,
  loaderContext
}, callback) {
  const mpx = loaderContext.getMpx()
  const thisContext = loaderContext.context
  const mode = mpx.mode
  const pagesMap = mpx.pagesMap
  async.waterfall([
    (callback) => {
      getJSONContent(partsJSON, null, loaderContext, callback)
    },
    (jsonContent, callback) => {
      if (!jsonContent) return callback(null, {})
      let componentPlaceholder = []
      let componentGenerics = {}
      const usingComponentsInfo = {}
      const usingComponents = {}
      partsJSON.content = jsonContent

      const finalCallback = (err) => {
        if (err) return callback(err)
        if (ctorType === 'app') {
          // 在 rulesRunner 运行后保存全局注册组件
          // todo 其余地方在使用mpx.globalComponents时存在缓存问题，要规避该问题需要在所有使用mpx.globalComponents的loader中添加app resourcePath作为fileDependency，但对于缓存有效率影响巨大
          // todo 需要考虑一种精准控制缓存的方式，仅在全局组件发生变更时才使相关使用方的缓存失效，例如按需在相关模块上动态添加request query？
          loaderContext._module.addPresentationalDependency(new RecordGlobalComponentsDependency(usingComponents, usingComponentsInfo, thisContext))
        }
        callback(null, {
          componentPlaceholder,
          componentGenerics,
          usingComponentsInfo: Object.assign({}, usingComponentsInfo, mpx.globalComponentsInfo)
        })
      }
      try {
        const ret = JSON5.parse(jsonContent)
        const rulesRunnerOptions = {
          mode,
          srcMode,
          type: 'json',
          waterfall: true,
          warn: emitWarning,
          error: emitError,
          data: {
            globalComponents: usingComponents
          }
        }
        if (ctorType !== 'app') {
          rulesRunnerOptions.mainKey = pagesMap[resourcePath] ? 'page' : 'component'
        }
        const rulesRunner = getRulesRunner(rulesRunnerOptions)
        try {
          if (rulesRunner) rulesRunner(ret)
        } catch (e) {
          return finalCallback(e)
        }
        // isApp 时 json rules 中 fillGlobalComponents 方法会对 data.globalComponents 反写，执行 rulesRunner 之后 usingComponents中即有app.json中usingComponents内容
        // page | component 时 直接获取 ret.usingComponents 内容
        Object.assign(usingComponents, ret.usingComponents)

        if (ret.componentPlaceholder) {
          componentPlaceholder = componentPlaceholder.concat(Object.values(ret.componentPlaceholder))
        }
        if (ret.componentGenerics) {
          componentGenerics = Object.assign({}, ret.componentGenerics)
        }
        if (usingComponents) {
          const setUsingComponentInfo = (name, moduleId) => {
            usingComponentsInfo[name] = { mid: moduleId }
          }
          async.eachOf(usingComponents, (component, name, callback) => {
            if (ctorType === 'app') {
              usingComponents[name] = addQuery(component, {
                context: thisContext
              })
            }
            if (!isUrlRequest(component)) {
              const moduleId = mpx.getModuleId(component, ctorType === 'app')
              setUsingComponentInfo(name, moduleId)
              return callback()
            }
            resolve(thisContext, component, loaderContext, (err, resource) => {
              if (err) return callback(err)
              const { rawResourcePath } = parseRequest(resource)
              const moduleId = mpx.getModuleId(rawResourcePath, ctorType === 'app')
              setUsingComponentInfo(name, moduleId)
              callback()
            })
          }, (err) => {
            finalCallback(err)
          })
        } else {
          finalCallback()
        }
      } catch (err) {
        finalCallback(err)
      }
    }
  ], callback)
}
