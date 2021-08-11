const JSON5 = require('json5')
const parseComponent = require('./parser')
const createHelpers = require('./helpers')
const loaderUtils = require('loader-utils')
const InjectDependency = require('./dependencies/InjectDependency')
const parseRequest = require('./utils/parse-request')
const matchCondition = require('./utils/match-condition')
const fixUsingComponent = require('./utils/fix-using-component')
const addQuery = require('./utils/add-query')
const async = require('async')
const processJSON = require('./web/processJSON')
const processScript = require('./web/processScript')
const processStyles = require('./web/processStyles')
const processTemplate = require('./web/processTemplate')
const readJsonForSrc = require('./utils/read-json-for-src')
const normalize = require('./utils/normalize')
const getMainCompilation = require('./utils/get-main-compilation')

module.exports = function (content) {
  this.cacheable()

  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__
  if (!mpx) {
    return content
  }
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const packageName = queryObj.packageName || mpx.currentPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const resolveMode = mpx.resolveMode
  const projectRoot = mpx.projectRoot
  const mode = mpx.mode
  const env = mpx.env
  const defs = mpx.defs
  const i18n = mpx.i18n
  const globalSrcMode = mpx.srcMode
  const localSrcMode = queryObj.mode
  const srcMode = localSrcMode || globalSrcMode
  const vueContentCache = mpx.vueContentCache
  const autoScope = matchCondition(resourcePath, mpx.autoScopeRules)

  // 支持资源query传入page或component支持页面/组件单独编译
  if ((queryObj.component && !componentsMap[resourcePath]) || (queryObj.page && !pagesMap[resourcePath])) {
    let entryChunkName
    const rawRequest = this._module.rawRequest
    for (const [, { options }] of mainCompilation.entries) {
      if (rawRequest === options.request) {
        entryChunkName = options.name
        break
      }
    }
    if (queryObj.component) {
      componentsMap[resourcePath] = entryChunkName || 'noEntryComponent'
    } else {
      pagesMap[resourcePath] = entryChunkName || 'noEntryPage'
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

  const loaderContext = this
  const stringifyRequest = r => loaderUtils.stringifyRequest(loaderContext, r)
  const isProduction = this.minimize || process.env.NODE_ENV === 'production'
  const processSrcQuery = (src, type) => {
    const localQuery = Object.assign({}, queryObj)

    if (type === 'styles') {
      localQuery.isStatic = true
      localQuery.issuerResource = this.resource
    } else {
      localQuery.resourcePath = resourcePath
    }
    if (type === 'json') {
      localQuery.__component = true
    }
    return addQuery(src, localQuery)
  }

  const filePath = resourcePath

  const moduleId = 'm' + mpx.pathHash(filePath)

  const parts = parseComponent(content, {
    filePath,
    needMap: this.sourceMap,
    mode,
    defs,
    env
  })

  let output = ''
  const callback = this.async()

  async.waterfall([
    (callback) => {
      const json = parts.json || {}
      if (json.src) {
        readJsonForSrc(json.src, loaderContext, (err, result) => {
          if (err) return callback(err)
          json.content = result
          callback()
        })
      } else {
        callback()
      }
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
        if (ctorType === 'app' && !queryObj.app) {
          const request = addQuery(this.resource, { app: true })
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
                  hasScoped,
                  hasComment,
                  isNative,
                  mode,
                  srcMode,
                  defs,
                  loaderContext,
                  moduleId,
                  ctorType,
                  usingComponents,
                  componentGenerics,
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
              i18n,
              componentGenerics,
              projectRoot,
              jsonConfig: jsonRes.jsonObj,
              componentId: queryObj.componentId || '',
              tabBarMap: jsonRes.tabBarMap,
              tabBarStr: jsonRes.tabBarStr,
              builtInComponentsMap: templateRes.builtInComponentsMap,
              genericsInfo: templateRes.genericsInfo,
              wxsModuleMap: templateRes.wxsModuleMap,
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

      const {
        getRequire,
        getRequestString,
      } = createHelpers(loaderContext)

      // todo webpack5不再支持注入global
      // 注入模块id及资源路径
      output += `global.currentModuleId = ${JSON.stringify(moduleId)}\n`
      if (!isProduction) {
        output += `global.currentResource = ${JSON.stringify(filePath)}\n`
      }
      if (ctorType === 'app' && i18n) {
        output += `global.i18n = ${JSON.stringify({ locale: i18n.locale, version: 0 })}\n`


        const i18nMethodsVar = 'i18nMethods'
        const i18nWxsPath = normalize.lib('runtime/i18n.wxs')
        const i18nWxsLoaderPath = normalize.lib('wxs/wxs-i18n-loader.js')
        const i18nWxsRequest = i18nWxsLoaderPath + '!' + i18nWxsPath
        const expression = `require(${loaderUtils.stringifyRequest(loaderContext, i18nWxsRequest)})`
        const deps = []
        this._module.parser.parse(expression, {
          current: {
            addDependency: dep => {
              dep.userRequest = i18nMethodsVar
              deps.push(dep)
            }
          },
          module: this._module
        })
        // todo webpack5中不再支持addVariable
        this._module.addVariable(i18nMethodsVar, expression, deps)

        output += `global.i18nMethods = ${i18nMethodsVar}\n`
      }
      // 注入构造函数
      let ctor = 'App'
      if (ctorType === 'page') {
        if (mpx.forceUsePageCtor || mode === 'ali') {
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
        }
        if (template.src) extraOptions.resourcePath = resourcePath
        // 基于global.currentInject来注入模板渲染函数和refs等信息
        output += getRequire('template', template, extraOptions) + '\n\n'
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
            // style src会被特殊处理为全局复用样式，不添加resourcePath，添加isStatic及issuerResource
            extraOptions.isStatic = true
            extraOptions.issuerResource = this.resource
          }
          output += getRequire('styles', style, extraOptions, i) + '\n'
        })
        output += '\n'
      }

      // json
      output += '/* json */\n'
      // 给予json默认值, 确保生成json request以自动补全json
      const json = parts.json || {}
      output += getRequire('json', json, json.src && { resourcePath })

      // script
      output += '/* script */\n'
      let scriptSrcMode = srcMode
      const script = parts.script
      if (script) {
        scriptSrcMode = script.mode || scriptSrcMode
        if (scriptSrcMode) output += `global.currentSrcMode = ${JSON.stringify(scriptSrcMode)}\n`
        const extraOptions = {}
        if (script.src) extraOptions.resourcePath = resourcePath
        // todo 通过isAppScript标识当前模块，分包处理需要等该模块的依赖处理完成后才能进行，严谨来说也应该等待app.json和app.wxss处理完成后才能开始，后续优化
        if (ctorType === 'app') extraOptions.isAppScript = true
        output += getRequire('script', script, extraOptions)
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
