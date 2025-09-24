const RecordGlobalComponentsDependency = require('../dependencies/RecordGlobalComponentsDependency')
const JSON5 = require('json5')
const isUrlRequest = require('./is-url-request')
const parseRequest = require('./parse-request')
const addQuery = require('./add-query')
const resolve = require('./resolve')
const getJSONContent = require('./get-json-content')
const getRulesRunner = require('../platform')
const { matchCondition } = require('./match-condition')
const async = require('async')

module.exports = function ({
  json,
  srcMode,
  emitWarning,
  emitError,
  ctorType,
  resourcePath,
  loaderContext
}, callback) {
  const mpx = loaderContext.getMpx()
  const context = loaderContext.context
  const { mode, pagesMap, autoVirtualHostRules, customTextRules } = mpx
  async.waterfall([
    (callback) => {
      getJSONContent(json, null, loaderContext, callback)
    },
    (jsonContent, callback) => {
      if (!jsonContent) return callback(null, {})
      let componentPlaceholder = []
      let componentGenerics = {}
      const usingComponentsInfo = {}
      const usingComponents = {}
      const finalCallback = (err) => {
        if (err) return callback(err)
        if (ctorType === 'app') {
          // 在 rulesRunner 运行后保存全局注册组件
          // todo 其余地方在使用mpx.globalComponents时存在缓存问题，要规避该问题需要在所有使用mpx.globalComponents的loader中添加app resourcePath作为fileDependency，但对于缓存有效率影响巨大
          // todo 需要考虑一种精准控制缓存的方式，仅在全局组件发生变更时才使相关使用方的缓存失效，例如按需在相关模块上动态添加request query？
          loaderContext._module.addPresentationalDependency(new RecordGlobalComponentsDependency(usingComponents, usingComponentsInfo, context))
        }
        callback(null, {
          componentPlaceholder,
          componentGenerics,
          usingComponentsInfo: Object.assign({}, usingComponentsInfo, mpx.globalComponentsInfo),
          jsonContent
        })
      }
      try {
        const ret = JSON5.parse(jsonContent)
        const rulesMeta = {}
        const rulesRunnerOptions = {
          mode,
          srcMode,
          type: 'json',
          waterfall: true,
          warn: emitWarning,
          error: emitError,
          meta: rulesMeta
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
        // 不支持全局组件的平台，runRules 时会删除 app.json 中的 usingComponents, 同时 fillGlobalComponents 方法会对 rulesMeta 赋值 usingComponents，通过 rulesMeta 来重新获取 globalComponents
        // page | component 时 直接获取 ret.usingComponents 内容
        Object.assign(usingComponents, ret.usingComponents || rulesMeta.usingComponents)

        if (ret.componentPlaceholder) {
          componentPlaceholder = componentPlaceholder.concat(Object.values(ret.componentPlaceholder))
        }
        if (ret.componentGenerics) {
          componentGenerics = Object.assign({}, ret.componentGenerics)
        }
        if (usingComponents) {
          const setUsingComponentInfo = (name, info) => {
            usingComponentsInfo[name] = info
          }
          async.eachOf(usingComponents, (component, name, callback) => {
            if (ctorType === 'app') {
              usingComponents[name] = addQuery(component, {
                context
              })
            }
            if (!isUrlRequest(component)) {
              const moduleId = mpx.getModuleId(component, ctorType === 'app')
              setUsingComponentInfo(name, moduleId)
              return callback()
            }
            resolve(context, component, loaderContext, (err, resource) => {
              if (err) return callback(err)
              const { rawResourcePath } = parseRequest(resource)
              const moduleId = mpx.getModuleId(rawResourcePath, ctorType === 'app')
              const hasVirtualHost = matchCondition(rawResourcePath, autoVirtualHostRules)
              setUsingComponentInfo(name, {
                mid: moduleId,
                hasVirtualHost
              })
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
