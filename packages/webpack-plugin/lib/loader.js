const JSON5 = require('json5')
const parseComponent = require('./parser')
const createHelpers = require('./helpers')
const loaderUtils = require('loader-utils')
const InjectDependency = require('./dependency/InjectDependency')
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
const { MPX_APP_MODULE_ID } = require('./staticConfig')
module.exports = function (content) {
  this.cacheable()

  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__
  if (!mpx) {
    return content
  }
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const packageName = queryObj.packageRoot || mpx.currentPackageRoot || 'main'
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
  const webRouteMode = mpx.webConfig.routeMode || 'hash'
  const autoScope = matchCondition(resourcePath, mpx.autoScopeRules)

  // 支持资源query传入page或component支持页面/组件单独编译
  if ((queryObj.component && !componentsMap[resourcePath]) || (queryObj.page && !pagesMap[resourcePath])) {
    let entryChunkName
    const rawRequest = this._module.rawRequest
    const _preparedEntrypoints = this._compilation._preparedEntrypoints
    for (let i = 0; i < _preparedEntrypoints.length; i++) {
      if (rawRequest === _preparedEntrypoints[i].request) {
        entryChunkName = _preparedEntrypoints[i].name
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
  const options = loaderUtils.getOptions(this) || {}
  const processSrcQuery = (src, type) => {
    const localQuery = Object.assign({}, queryObj)
    // style src会被特殊处理为全局复用样式，不添加resourcePath，添加isStatic及issuerResource
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

  let moduleId = 'm' + mpx.pathHash(filePath)
  if (ctorType === 'app') {
    moduleId = MPX_APP_MODULE_ID
  }

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
      // 只有ali才可能需要scoped
      const hasScoped = (parts.styles.some(({ scoped }) => scoped) || autoScope) && mode === 'ali'
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

      const {
        getRequire,
        getRequireForSrc,
        getRequestString,
        getSrcRequestString
      } = createHelpers({
        loaderContext,
        options,
        moduleId,
        hasScoped,
        hasComment,
        usingComponents,
        srcMode,
        isNative,
        projectRoot
      })

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
                  autoScope,
                  moduleId
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
              i18n,
              componentGenerics,
              projectRoot,
              webRouteMode,
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

      // 触发webpack global var 注入
      output += 'global.currentModuleId\n'

      // todo loader中inject dep比较危险，watch模式下不一定靠谱，可考虑将import改为require然后通过修改loader内容注入
      // 注入模块id及资源路径
      let globalInjectCode = `global.currentModuleId = ${JSON.stringify(moduleId)}\n`
      if (!isProduction) {
        globalInjectCode += `global.currentResource = ${JSON.stringify(filePath)}\n`
      }
      if (ctorType === 'app' && i18n && !mpx.forceDisableInject) {
        globalInjectCode += `global.i18n = ${JSON.stringify({ locale: i18n.locale, version: 0 })}\n`

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
        this._module.addVariable(i18nMethodsVar, expression, deps)

        globalInjectCode += `global.i18nMethods = ${i18nMethodsVar}\n`
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
      globalInjectCode += `global.currentCtor = ${ctor}\n`
      globalInjectCode += `global.currentResourceType = '${ctorType}'\n`
      globalInjectCode += `global.currentCtorType = ${JSON.stringify(ctor.replace(/^./, (match) => {
        return match.toLowerCase()
      }))}\n`

      // <script>
      output += '/* script */\n'
      let scriptSrcMode = srcMode
      const script = parts.script
      if (script) {
        scriptSrcMode = script.mode || scriptSrcMode
        let scriptRequestString
        if (script.src) {
          // 传入resourcePath以确保后续处理中能够识别src引入的资源为组件主资源
          script.src = processSrcQuery(script.src, 'script')
          scriptRequestString = getSrcRequestString('script', script)
        } else {
          scriptRequestString = getRequestString('script', script)
        }
        if (scriptRequestString) {
          output += 'export * from ' + scriptRequestString + '\n\n'
          if (ctorType === 'app') mpx.appScriptRawRequest = JSON.parse(scriptRequestString)
        }
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

      if (scriptSrcMode) {
        globalInjectCode += `global.currentSrcMode = ${JSON.stringify(scriptSrcMode)}\n`
      }

      // styles
      output += '/* styles */\n'
      let cssModules
      if (parts.styles.length) {
        let styleInjectionCode = ''
        parts.styles.forEach((style, i) => {
          let scoped = hasScoped ? (style.scoped || autoScope) : false
          let requireString
          // require style
          if (style.src) {
            style.src = processSrcQuery(style.src, 'styles')
            requireString = getRequireForSrc('styles', style, -1, scoped)
          } else {
            requireString = getRequire('styles', style, i, scoped)
          }
          const hasStyleLoader = requireString.indexOf('style-loader') > -1
          const invokeStyle = code => `${code}\n`

          const moduleName = style.module === true ? '$style' : style.module
          // setCssModule
          if (moduleName) {
            if (!cssModules) {
              cssModules = {}
            }
            if (moduleName in cssModules) {
              loaderContext.emitError(
                'CSS module name "' + moduleName + '" is not unique!'
              )
              styleInjectionCode += invokeStyle(requireString)
            } else {
              cssModules[moduleName] = true

              if (!hasStyleLoader) {
                requireString += '.locals'
              }

              styleInjectionCode += invokeStyle(
                'this["' + moduleName + '"] = ' + requireString
              )
            }
          } else {
            styleInjectionCode += invokeStyle(requireString)
          }
        })
        output += styleInjectionCode + '\n'
      } else if (ctorType === 'app' && mode === 'ali') {
        output += getRequire('styles', {}) + '\n'
      }

      // json
      output += '/* json */\n'
      // 给予json默认值, 确保生成json request以自动补全json
      const json = parts.json || {}
      if (json.src) {
        json.src = processSrcQuery(json.src, 'json')
        output += getRequireForSrc('json', json) + '\n\n'
      } else {
        output += getRequire('json', json) + '\n\n'
      }

      // template
      output += '/* template */\n'
      const template = parts.template

      if (template) {
        if (template.src) {
          template.src = processSrcQuery(template.src, 'template')
          output += getRequireForSrc('template', template) + '\n\n'
        } else {
          output += getRequire('template', template) + '\n\n'
        }
      }

      if (!mpx.forceDisableInject) {
        const dep = new InjectDependency({
          content: globalInjectCode,
          index: -3
        })
        this._module.addDependency(dep)
      }

      callback(null, output)
    }
  ], callback)
}
