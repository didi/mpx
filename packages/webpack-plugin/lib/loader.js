const JSON5 = require('json5')
const parseComponent = require('./parser')
const createHelpers = require('./helpers')
const loaderUtils = require('loader-utils')
const parseRequest = require('./utils/parse-request')
const matchCondition = require('./utils/match-condition')
const fixUsingComponent = require('./utils/fix-using-component')
const addQuery = require('./utils/add-query')
const async = require('async')
const processJSON = require('./web/processJSON')
const processScript = require('./web/processScript')
const processStyles = require('./web/processStyles')
const processTemplate = require('./web/processTemplate')
const getJSONContent = require('./utils/get-json-content')
const normalize = require('./utils/normalize')
const getEntryName = require('./utils/get-entry-name')
const AppEntryDependency = require('./dependencies/AppEntryDependency')

module.exports = function (content) {
  this.cacheable()

  const mpx = this.getMpx()
  if (!mpx) {
    return content
  }
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const packageName = queryObj.packageRoot || mpx.currentPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const mode = mpx.mode
  const env = mpx.env
  const i18n = mpx.i18n
  const globalSrcMode = mpx.srcMode
  const localSrcMode = queryObj.mode
  const srcMode = localSrcMode || globalSrcMode
  const vueContentCache = mpx.vueContentCache
  const autoScope = matchCondition(resourcePath, mpx.autoScopeRules)

  // 支持资源query传入isPage或isComponent支持页面/组件单独编译
  if ((queryObj.isComponent && !componentsMap[resourcePath]) || (queryObj.isPage && !pagesMap[resourcePath])) {
    const entryName = getEntryName(this)
    if (queryObj.isComponent) {
      componentsMap[resourcePath] = entryName || 'noEntryComponent'
    } else {
      pagesMap[resourcePath] = entryName || 'noEntryPage'
    }
  }

  let ctorType = 'app'
  if (pagesMap[resourcePath]) {
    // page
    ctorType = 'page'
  } else if (componentsMap[resourcePath]) {
    // component
    ctorType = 'component'
  }

  if (ctorType === 'app') {
    const appName = getEntryName(this)
    this._module.addPresentationalDependency(new AppEntryDependency(resourcePath, appName))
  }

  const loaderContext = this
  const stringifyRequest = r => loaderUtils.stringifyRequest(loaderContext, r)
  const isProduction = this.minimize || process.env.NODE_ENV === 'production'

  const filePath = resourcePath

  const moduleId = 'm' + mpx.pathHash(filePath)

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
      if (mode === 'web') {
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

      const {
        getRequire
      } = createHelpers(loaderContext)

      // 注入模块id及资源路径
      output += `global.currentModuleId = ${JSON.stringify(moduleId)}\n`
      if (!isProduction) {
        output += `global.currentResource = ${JSON.stringify(filePath)}\n`
      }
      if (ctorType === 'app' && i18n) {
        output += `global.i18n = ${JSON.stringify({ locale: i18n.locale, version: 0 })}\n`

        const i18nWxsPath = normalize.lib('runtime/i18n.wxs')
        const i18nWxsLoaderPath = normalize.lib('wxs/i18n-loader.js')
        const i18nWxsRequest = i18nWxsLoaderPath + '!' + i18nWxsPath

        output += `global.i18nMethods = require(${loaderUtils.stringifyRequest(loaderContext, i18nWxsRequest)})\n`
      }
      // 注入构造函数
      let ctor = 'App'
      if (ctorType === 'page') {
        // swan也默认使用Page构造器
        if (mpx.forceUsePageCtor || mode === 'ali' || mode === 'swan') {
          ctor = 'Page'
        } else {
          ctor = 'Component'
        }
      } else if (ctorType === 'component') {
        ctor = 'Component'
      }
      output += `global.currentCtor = ${ctor}\n`
      output += `global.currentCtorType = ${JSON.stringify(ctor.replace(/^./, (match) => {
        return match.toLowerCase()
      }))}\n`
      output += `global.currentResourceType = '${ctorType}'\n`

      // template
      output += '/* template */\n'
      const template = parts.template

      if (template) {
        const extraOptions = {
          hasScoped,
          hasComment,
          isNative,
          moduleId,
          usingComponents
          // 添加babel处理渲染函数中可能包含的...展开运算符
          // 由于...运算符应用范围极小以及babel成本极高，先关闭此特性后续看情况打开
          // needBabel: true
        }
        if (template.src) extraOptions.resourcePath = resourcePath
        // 基于global.currentInject来注入模板渲染函数和refs等信息
        output += getRequire('template', template, extraOptions) + '\n'
      }

      // styles
      output += '/* styles */\n'
      if (parts.styles.length) {
        parts.styles.forEach((style, i) => {
          const scoped = style.scoped || autoScope
          const extraOptions = {
            moduleId,
            scoped
          }
          // require style
          if (style.src) {
            // style src会被特殊处理为全局复用样式，不添加resourcePath，添加isStatic及issuerFile
            extraOptions.isStatic = true
            const issuerResource = addQuery(this.resource, { type: 'styles' }, true)
            extraOptions.issuerFile = mpx.getExtractedFile(issuerResource)
          }
          output += getRequire('styles', style, extraOptions, i) + '\n'
        })
      } else if (ctorType === 'app' && mode === 'ali') {
        output += getRequire('styles', {}) + '\n'
      }

      // json
      output += '/* json */\n'
      // 给予json默认值, 确保生成json request以自动补全json
      const json = parts.json || {}
      output += getRequire('json', json, json.src && { resourcePath }) + '\n'

      // script
      output += '/* script */\n'
      let scriptSrcMode = srcMode
      const script = parts.script
      if (script) {
        scriptSrcMode = script.mode || scriptSrcMode
        if (scriptSrcMode) output += `global.currentSrcMode = ${JSON.stringify(scriptSrcMode)}\n`
        const extraOptions = {}
        if (script.src) extraOptions.resourcePath = resourcePath
        output += getRequire('script', script, extraOptions) + '\n'
      } else {
        switch (ctorType) {
          case 'app':
            output += 'import {createApp} from "@mpxjs/core"\n' +
              'createApp({})\n'
            break
          case 'page':
            output += 'import {createPage} from "@mpxjs/core"\n' +
              'createPage({})\n'
            break
          case 'component':
            output += 'import {createComponent} from "@mpxjs/core"\n' +
              'createComponent({})\n'
        }
        output += '\n'
      }
      callback(null, output)
    }
  ], callback)
}
