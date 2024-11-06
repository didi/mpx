const JSON5 = require('json5')
const parseComponent = require('./parser')
const createHelpers = require('./helpers')
const parseRequest = require('./utils/parse-request')
const { matchCondition } = require('./utils/match-condition')
const addQuery = require('./utils/add-query')
const async = require('async')
const getJSONContent = require('./utils/get-json-content')
const normalize = require('./utils/normalize')
const getEntryName = require('./utils/get-entry-name')
const AppEntryDependency = require('./dependencies/AppEntryDependency')
const RecordResourceMapDependency = require('./dependencies/RecordResourceMapDependency')
const CommonJsVariableDependency = require('./dependencies/CommonJsVariableDependency')
const DynamicEntryDependency = require('./dependencies/DynamicEntryDependency')
const tsWatchRunLoaderFilter = require('./utils/ts-loader-watch-run-loader-filter')
const { isReact } = require('./utils/env')
const resolve = require('./utils/resolve')
const isUrlRequestRaw = require('./utils/is-url-request')
const path = require('path')
const processWeb = require('./web')
const processReact = require('./react')
const getRulesRunner = require('./platform')
const genMpxCustomElement = require('./runtime-render/gen-mpx-custom-element')

module.exports = function (content) {
  this.cacheable()

  // 兼容处理处理ts-loader中watch-run/updateFile逻辑，直接跳过当前loader及后续的loader返回内容
  const pathExtname = path.extname(this.resourcePath)
  if (!['.vue', '.mpx'].includes(pathExtname)) {
    this.loaderIndex = tsWatchRunLoaderFilter(this.loaders, this.loaderIndex)
    return content
  }

  const mpx = this.getMpx()
  if (!mpx) {
    return content
  }
  const { resourcePath, queryObj } = parseRequest(this.resource)

  const packageRoot = queryObj.packageRoot || mpx.currentPackageRoot
  const packageName = packageRoot || 'main'
  const independent = queryObj.independent
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const mode = mpx.mode
  const env = mpx.env
  const i18n = mpx.i18n
  const globalSrcMode = mpx.srcMode
  const localSrcMode = queryObj.mode
  const srcMode = localSrcMode || globalSrcMode
  const autoScope = matchCondition(resourcePath, mpx.autoScopeRules)
  const isRuntimeMode = queryObj.isDynamic
  const root = mpx.projectRoot

  const isUrlRequest = r => isUrlRequestRaw(r, root)

  const emitWarning = (msg) => {
    this.emitWarning(
      new Error('[mpx-loader][' + this.resource + ']: ' + msg)
    )
  }

  const emitError = (msg) => {
    this.emitError(
      new Error('[mpx-loader][' + this.resource + ']: ' + msg)
    )
  }

  let ctorType = pagesMap[resourcePath]
    ? 'page'
    : componentsMap[resourcePath]
      ? 'component'
      : 'app'

  // 支持资源query传入isPage或isComponent支持页面/组件单独编译
  if (ctorType === 'app' && (queryObj.isComponent || queryObj.isPage)) {
    const entryName = getEntryName(this) || mpx.getOutputPath(resourcePath, queryObj.isComponent ? 'component' : 'page')
    ctorType = queryObj.isComponent ? 'component' : 'page'
    this._module.addPresentationalDependency(new RecordResourceMapDependency(resourcePath, ctorType, entryName, packageRoot))
  }
  const isApp = ctorType === 'app'

  if (isApp) {
    const appName = getEntryName(this)
    if (appName) this._module.addPresentationalDependency(new AppEntryDependency(resourcePath, appName))
  }

  if (isRuntimeMode) {
    const { request, outputPath } = genMpxCustomElement(packageName)
    this._module.addPresentationalDependency(new DynamicEntryDependency([0, 0], request, 'component', outputPath, packageRoot, '', '', { replaceContent: '', postSubpackageEntry: true }))
  }

  const loaderContext = this
  const isProduction = this.minimize || process.env.NODE_ENV === 'production'
  const filePath = this.resourcePath
  const moduleId = mpx.getModuleId(resourcePath, isApp)

  const parts = parseComponent(content, {
    filePath,
    needMap: this.sourceMap,
    mode,
    env
  })

  const {
    getRequire
  } = createHelpers(loaderContext)

  const callback = this.async()

  async.waterfall([
    (callback) => {
      getJSONContent(parts.json || {}, null, loaderContext, (err, content) => {
        if (err) return callback(err)
        if (parts.json) parts.json.content = content
        callback(null, content || '{}')
      })
    },
    (jsonContent, callback) => {
      if (!jsonContent) return callback(null, {})
      let componentPlaceholder = []
      let componentGenerics = {}
      let usingComponentsInfo = {}
      const finalCallback = (err) => {
        usingComponentsInfo = Object.assign(usingComponentsInfo, mpx.globalComponentsInfo)
        callback(err, {
          componentPlaceholder,
          componentGenerics,
          usingComponentsInfo,
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
          error: emitError
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

        if (ret.componentPlaceholder) {
          componentPlaceholder = componentPlaceholder.concat(Object.values(ret.componentPlaceholder))
        }
        if (ret.componentGenerics) {
          componentGenerics = Object.assign({}, ret.componentGenerics)
        }
        if (ret.usingComponents) {
          // fixUsingComponent(ret.usingComponents, mode)
          const setUsingComponentInfo = (name, moduleId) => { usingComponentsInfo[name] = { mid: moduleId } }
          async.eachOf(ret.usingComponents, (component, name, callback) => {
            if (!isUrlRequest(component)) {
              const moduleId = mpx.getModuleId(component, isApp)
              // 避免和 RecordGlobalComponentsDependency 冲突
              if (!isApp) {
                setUsingComponentInfo(name, moduleId)
              }
              return callback()
            }
            resolve(this.context, component, loaderContext, (err, resource) => {
              if (err) return callback(err)
              const { rawResourcePath } = parseRequest(resource)
              const moduleId = mpx.getModuleId(rawResourcePath, isApp)
              // 避免和 RecordGlobalComponentsDependency 冲突
              if (!isApp) {
                setUsingComponentInfo(name, moduleId)
              }
              callback()
            })
          }, (err) => {
            finalCallback(err)
          })
        } else {
          finalCallback(null)
        }
      } catch (err) {
        finalCallback(err)
      }
    },
    (componentInfo, callback) => {
      const {
        componentPlaceholder,
        componentGenerics,
        usingComponentsInfo
      } = componentInfo

      const hasScoped = parts.styles.some(({ scoped }) => scoped) || autoScope
      const templateAttrs = parts.template && parts.template.attrs
      const hasComment = templateAttrs && templateAttrs.comments
      const isNative = false

      // 处理mode为web时输出vue格式文件
      if (mode === 'web') {
        return processWeb({
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
          usingComponentsInfo,
          componentGenerics,
          autoScope,
          callback
        })
      }
      // 处理mode为react时输出js格式文件
      if (isReact(mode)) {
        return processReact({
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
          usingComponentsInfo,
          componentGenerics,
          autoScope,
          callback
        })
      }

      const moduleGraph = this._compilation.moduleGraph

      const issuer = moduleGraph.getIssuer(this._module)

      if (issuer) {
        return callback(new Error(`Current ${ctorType} [${this.resourcePath}] is issued by [${issuer.resource}], which is not allowed!`))
      }

      let output = ''
      // 注入模块id及资源路径
      output += `global.currentModuleId = ${JSON.stringify(moduleId)}\n`
      if (!isProduction) {
        output += `global.currentResource = ${JSON.stringify(filePath)}\n`
      }

      // 为app注入i18n
      if (i18n && isApp) {
        const i18nWxsPath = normalize.lib('runtime/i18n.wxs')
        const i18nWxsLoaderPath = normalize.lib('wxs/i18n-loader.js')
        const i18nWxsRequest = i18nWxsLoaderPath + '!' + i18nWxsPath
        this._module.addDependency(new CommonJsVariableDependency(i18nWxsRequest))
        // 避免该模块被concatenate导致注入的i18n没有最先执行
        this._module.buildInfo.moduleConcatenationBailout = 'i18n'
      }

      // 为独立分包注入init module
      if (independent && typeof independent === 'string') {
        const independentLoader = normalize.lib('independent-loader.js')
        const independentInitRequest = `!!${independentLoader}!${independent}`
        this._module.addDependency(new CommonJsVariableDependency(independentInitRequest))
        // 避免该模块被concatenate导致注入的independent init没有最先执行
        this._module.buildInfo.moduleConcatenationBailout = 'independent init'
      }

      // 注入构造函数
      const ctor = ctorType === 'page'
        ? (mpx.forceUsePageCtor || mode === 'ali') ? 'Page' : 'Component'
        : ctorType === 'component'
          ? 'Component'
          : 'App'

      output += `global.currentCtor = ${ctor}\n`
      output += `global.currentCtorType = ${JSON.stringify(ctor.replace(/^./, (match) => {
        return match.toLowerCase()
      }))}\n`
      output += `global.currentResourceType = ${JSON.stringify(ctorType)}\n`

      // template
      output += '/* template */\n'
      const template = parts.template

      if (template) {
        const extraOptions = {
          ...template.src
            ? { ...queryObj, resourcePath }
            : null,
          hasScoped,
          hasComment,
          isNative,
          ctorType,
          moduleId,
          usingComponentsInfo,
          componentPlaceholder
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
            // style src会被特殊处理为全局复用样式，不添加resourcePath，添加isStatic及issuerFile
            ...style.src
              ? { ...queryObj, isStatic: true, issuerResource: addQuery(this.resource, { type: 'styles' }, true) }
              : null,
            moduleId,
            scoped
          }
          // require style
          output += getRequire('styles', style, extraOptions, i) + '\n'
        })
      }

      if (parts.styles.filter(style => !style.src).length === 0 && isApp && mode === 'ali') {
        output += getRequire('styles', {}, {}, parts.styles.length) + '\n'
      }

      // json
      output += '/* json */\n'
      // 给予json默认值, 确保生成json request以自动补全json
      const json = parts.json || {}
      output += getRequire('json', json, json.src && { ...queryObj, resourcePath }) + '\n'

      // script
      output += '/* script */\n'
      let scriptSrcMode = srcMode
      // 给予script默认值, 确保生成js request以自动补全js
      const script = parts.script || {}
      if (script) {
        scriptSrcMode = script.mode || scriptSrcMode
        if (scriptSrcMode) output += `global.currentSrcMode = ${JSON.stringify(scriptSrcMode)}\n`
        // 传递ctorType以补全js内容
        const extraOptions = {
          ...script.src
            ? { ...queryObj, resourcePath }
            : null,
          ctorType,
          lang: script.lang || 'js'
        }
        output += getRequire('script', script, extraOptions) + '\n'
      }
      callback(null, output)
    }
  ], callback)
}
