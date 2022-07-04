const JSON5 = require('json5')
const parseComponent = require('@mpxjs/webpack-plugin/lib/parser')
const loaderUtils = require('loader-utils')
const parseRequest = require('@mpxjs/webpack-plugin/lib/utils/parse-request')
const { matchCondition } = require('@mpxjs/webpack-plugin/lib/utils/match-condition')
const fixUsingComponent = require('@mpxjs/webpack-plugin/lib/utils/fix-using-component')
const addQuery = require('@mpxjs/webpack-plugin/lib/utils/add-query')
const async = require('async')
const processJSON = require('../lib/web/processJSON')
const processScript = require('../lib/web/processScript')
const processStyles = require('../lib/web/processStyles')
const processTemplate = require('../lib/web/processTemplate')
const getJSONContent = require('@mpxjs/webpack-plugin/lib/utils/get-json-content')
const { MPX_APP_MODULE_ID } = require('@mpxjs/webpack-plugin/lib/utils/const')
const path = require('path')

module.exports = function (content) {
  this.cacheable()

  // 兼容处理处理ts-loader中watch-run/updateFile逻辑，直接跳过当前loader及后续的vue-loader返回内容
  if (path.extname(this.resourcePath) === '.ts') {
    this.loaderIndex -= 2
    return content
  }

  const mpx = this.getMpx()
  if (!mpx) {
    return content
  }
  const { resourcePath, queryObj } = parseRequest(this.resource)

  const packageRoot = queryObj.packageRoot || mpx.currentPackageRoot
  const packageName = packageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const mode = mpx.mode
  const env = mpx.env
  const globalSrcMode = mpx.srcMode
  const localSrcMode = queryObj.mode
  const srcMode = localSrcMode || globalSrcMode
  const vueContentCache = mpx.vueContentCache
  const autoScope = matchCondition(resourcePath, mpx.autoScopeRules)

  let ctorType = 'app'
  if (pagesMap[resourcePath]) {
    // page
    ctorType = 'page'
  } else if (componentsMap[resourcePath]) {
    // component
    ctorType = 'component'
  }
  const loaderContext = this
  const stringifyRequest = r => loaderUtils.stringifyRequest(loaderContext, r)
  const isProduction = this.minimize || process.env.NODE_ENV === 'production'
  const filePath = this.resourcePath
  const moduleId = ctorType === 'app' ? MPX_APP_MODULE_ID : 'm' + mpx.pathHash(filePath)

  const parts = parseComponent(content, {
    filePath,
    needMap: this.sourceMap,
    mode,
    env
  })

  let output = ''
  const callback = this.async()

  async.waterfall([
    (callback) => {
      getJSONContent(parts.json || {}, loaderContext, (err, content) => {
        if (err) return callback(err)
        if (parts.json) parts.json.content = content
        callback()
      })
    },
    (callback) => {
      // web输出模式下没有任何inject，可以通过cache直接返回，由于读取src json可能会新增模块依赖，需要在之后返回缓存内容
      if (vueContentCache.has(filePath)) {
        return callback(null, vueContentCache.get(filePath))
      }
      const hasScoped = parts.styles.some(({ scoped }) => scoped) || autoScope
      const templateAttrs = parts.template && parts.template.attrs
      const hasComment = templateAttrs && templateAttrs.comments
      const isNative = false

      let usingComponents = [].concat(Object.keys(mpx.usingComponents))

      let componentGenerics = {}

      if (parts.json && parts.json.content) {
        try {
          let ret = JSON5.parse(parts.json.content)
          if (ret.usingComponents) {
            fixUsingComponent(ret.usingComponents, mode)
            usingComponents = usingComponents.concat(Object.keys(ret.usingComponents))
          }
          if (ret.componentGenerics) {
            componentGenerics = Object.assign({}, ret.componentGenerics)
          }
        } catch (e) {
          return callback(e)
        }
      }

      // 处理mode为web时输出vue格式文件
      if (ctorType === 'app' && !queryObj.isApp) {
        const request = addQuery(this.resource, { isApp: true })
        output += `
      import App from ${stringifyRequest(request)}
      import Vue from 'vue'
      new Vue({
        el: '#app',
        render: function(h){
          return h(App)
        }
      })\n
      `
        // 直接结束loader进入parse
        this.loaderIndex = -1
        return callback(null, output)
      }

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
          if (ctorType === 'app' && jsonRes.jsonObj.window && jsonRes.jsonObj.window.navigationBarTitleText) {
            mpx.appTitle = jsonRes.jsonObj.window.navigationBarTitleText
          }

          processScript(parts.script, {
            loaderContext,
            ctorType,
            srcMode,
            isProduction,
            componentGenerics,
            jsonConfig: jsonRes.jsonObj,
            outputPath: queryObj.outputPath || '',
            tabBarMap: jsonRes.tabBarMap,
            tabBarStr: jsonRes.tabBarStr,
            builtInComponentsMap: templateRes.builtInComponentsMap,
            genericsInfo: templateRes.genericsInfo,
            wxsModuleMap: templateRes.wxsModuleMap,
            localComponentsMap: jsonRes.localComponentsMap,
            localPagesMap: jsonRes.localPagesMap
          }, callback)
        }
      ], (err, scriptRes) => {
        if (err) return callback(err)
        output += scriptRes.output
        vueContentCache.set(filePath, output)
        callback(null, output)
      })
    }
  ], callback)
}
