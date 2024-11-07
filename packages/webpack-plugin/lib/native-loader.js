const path = require('path')
const JSON5 = require('json5')
const parseRequest = require('./utils/parse-request')
const config = require('./config')
const createHelpers = require('./helpers')
const getJSONContent = require('./utils/get-json-content')
const async = require('async')
const { matchCondition } = require('./utils/match-condition')
const { JSON_JS_EXT } = require('./utils/const')
const getRulesRunner = require('./platform')
const getEntryName = require('./utils/get-entry-name')
const AppEntryDependency = require('./dependencies/AppEntryDependency')
const RecordResourceMapDependency = require('./dependencies/RecordResourceMapDependency')
const isUrlRequestRaw = require('./utils/is-url-request')
const resolve = require('./utils/resolve')
const addQuery = require('./utils/add-query')
const RecordGlobalComponentsDependency = require('./dependencies/RecordGlobalComponentsDependency')

// todo native-loader考虑与mpx-loader或加强复用，原生组件约等于4个区块都为src的.mpx文件
module.exports = function (content) {
  this.cacheable()

  const mpx = this.getMpx()
  if (!mpx) {
    return content
  }

  const nativeCallback = this.async()
  const loaderContext = this
  const isProduction = this.minimize || process.env.NODE_ENV === 'production'
  const filePath = this.resourcePath
  const moduleId = mpx.getModuleId(filePath)
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const packageRoot = queryObj.packageRoot || mpx.currentPackageRoot
  const mode = mpx.mode
  const globalSrcMode = mpx.srcMode
  const localSrcMode = queryObj.mode
  const packageName = queryObj.packageRoot || mpx.currentPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const parsed = path.parse(resourcePath)
  const resourceName = path.join(parsed.dir, parsed.name)
  const srcMode = localSrcMode || globalSrcMode
  const typeExtMap = config[srcMode].typeExtMap
  const typeResourceMap = {}
  const autoScope = matchCondition(resourcePath, mpx.autoScopeRules)
  const root = mpx.projectRoot

  const isUrlRequest = r => isUrlRequestRaw(r, root)

  const CSS_LANG_EXT_MAP = {
    less: '.less',
    stylus: '.styl',
    sass: '.sass',
    scss: '.scss'
  }

  const TS_EXT = '.ts'

  let useJSONJS = false
  let cssLang = ''
  const hasScoped = (queryObj.scoped || autoScope) && mode === 'ali'
  const hasComment = false
  const isNative = true

  const checkFileExists = (extName, callback) => {
    this.resolve(parsed.dir, resourceName + extName, callback)
  }

  function checkCSSLangFile (callback) {
    const langs = mpx.nativeConfig.cssLangs || ['less', 'stylus', 'scss', 'sass']
    const results = []
    async.eachOf(langs, function (lang, i, callback) {
      if (!CSS_LANG_EXT_MAP[lang]) {
        return callback()
      }
      checkFileExists(CSS_LANG_EXT_MAP[lang], (err, result) => {
        if (!err && result) {
          results[i] = result
        }
        callback()
      })
    }, function (err) {
      for (let i = 0; i < langs.length; i++) {
        if (results[i]) {
          cssLang = langs[i]
          typeResourceMap.styles = results[i]
          break
        }
      }
      callback(err)
    })
  }

  function checkJSONJSFile (callback) {
    checkFileExists(JSON_JS_EXT, (err, result) => {
      if (!err && result) {
        typeResourceMap.json = result
        useJSONJS = true
      }
      callback()
    })
  }

  function checkTSFile (callback) {
    checkFileExists(TS_EXT, (err, result) => {
      if (!err && result) {
        typeResourceMap.script = result
      }
      callback()
    })
  }

  const emitWarning = (msg) => {
    this.emitWarning(
      new Error('[native-loader][' + this.resource + ']: ' + msg)
    )
  }

  const emitError = (msg) => {
    this.emitError(
      new Error('[native-loader][' + this.resource + ']: ' + msg)
    )
  }
  let ctorType = pagesMap[resourcePath]
    ? 'page'
    : componentsMap[resourcePath]
      ? 'component'
      : 'app'
  // 处理构造器类型
  const ctor = ctorType === 'page'
    ? (mpx.forceUsePageCtor || mode === 'ali') ? 'Page' : 'Component'
    : ctorType === 'component'
      ? 'Component'
      : 'App'

  // 支持资源query传入isPage或isComponent支持页面/组件单独编译
  if (ctorType === 'app' && (queryObj.isComponent || queryObj.isPage)) {
    const entryName = getEntryName(this) || mpx.getOutputPath(resourcePath, queryObj.isComponent ? 'component' : 'page')
    ctorType = queryObj.isComponent ? 'component' : 'page'
    this._module.addPresentationalDependency(new RecordResourceMapDependency(resourcePath, ctorType, entryName, packageRoot))
  }
  const isApp = ctorType === 'app'

  if (ctorType === 'app') {
    const appName = getEntryName(this)
    if (appName) this._module.addPresentationalDependency(new AppEntryDependency(resourcePath, appName))
  }
  // 先读取json获取usingComponents信息
  async.waterfall([
    (callback) => {
      async.parallel([
        checkCSSLangFile,
        checkJSONJSFile,
        checkTSFile
      ], (err) => {
        callback(err)
      })
    },
    (callback) => {
      async.forEachOf(typeExtMap, (ext, key, callback) => {
        // 对应资源存在预处理类型文件时跳过对应的标准文件检测
        if (typeResourceMap[key]) {
          return callback()
        }
        checkFileExists(ext, (err, result) => {
          if (!err && result) {
            typeResourceMap[key] = result
          }
          callback()
        })
      }, callback)
    },
    (callback) => {
      getJSONContent({
        src: typeResourceMap.json,
        useJSONJS
      }, null, this, callback)
    },
    (jsonContent, callback) => {
      if (!jsonContent) return callback(null, {})
      let componentPlaceholder = []
      let componentGenerics = {}
      let usingComponentsInfo = {}
      const finalCallback = (err) => {
        if (err) return
        usingComponentsInfo = Object.assign(usingComponentsInfo, mpx.globalComponentsInfo)
        callback(err, {
          componentPlaceholder,
          componentGenerics,
          usingComponentsInfo
        })
      }
      try {
        const json = JSON5.parse(jsonContent)
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
        if (isApp) {
          rulesRunnerOptions.data = {
            globalComponents: mpx.globalComponents
          }
        }
        const rulesRunner = getRulesRunner(rulesRunnerOptions)
        try {
          if (rulesRunner) rulesRunner(json)
        } catch (e) {
          return finalCallback(e)
        }

        if (json.componentPlaceholder) {
          componentPlaceholder = componentPlaceholder.concat(Object.values(json.componentPlaceholder))
        }
        if (json.componentGenerics) {
          componentGenerics = Object.assign({}, json.componentGenerics)
        }
        const usingComponents = isApp ? mpx.globalComponents : json.usingComponents
        if (usingComponents) {
          if (isApp) {
            Object.assign(mpx.globalComponents, json.usingComponents)
            // 在 rulesRunner 运行后保存全局注册组件
            // todo 其余地方在使用mpx.globalComponents时存在缓存问题，要规避该问题需要在所有使用mpx.globalComponents的loader中添加app resourcePath作为fileDependency，但对于缓存有效率影响巨大
            // todo 需要考虑一种精准控制缓存的方式，仅在全局组件发生变更时才使相关使用方的缓存失效，例如按需在相关模块上动态添加request query？
            this._module.addPresentationalDependency(new RecordGlobalComponentsDependency(mpx.globalComponents, mpx.globalComponentsInfo, this.context))
          }
          const setUsingComponentInfo = (name, moduleId) => { usingComponentsInfo[name] = { mid: moduleId } }
          async.eachOf(json.usingComponents, (component, name, callback) => {
            if (isApp) {
              mpx.globalComponents[name] = addQuery(component, {
                context: this.context
              })
            }
            if (!isUrlRequest(component)) {
              const moduleId = mpx.getModuleId(component, isApp)
              if (!isApp) {
                setUsingComponentInfo(name, moduleId)
              } else {
                mpx.globalComponentsInfo[name] = { mid: moduleId }
              }
              return callback()
            }
            resolve(this.context, component, loaderContext, (err, resource) => {
              if (err) return callback(err)
              const { rawResourcePath } = parseRequest(resource)
              const moduleId = mpx.getModuleId(rawResourcePath, isApp)
              if (!isApp) {
                setUsingComponentInfo(name, moduleId)
              } else {
                mpx.globalComponentsInfo[name] = { mid: moduleId }
              }
              callback()
            })
          }, (err) => {
            finalCallback(err)
          })
        } else {
          finalCallback()
        }
      } catch (e) {
        return finalCallback(e)
      }
    },
    (jsonInfo, callback) => {
      const {
        componentPlaceholder,
        componentGenerics,
        usingComponentsInfo
      } = jsonInfo

      const {
        getRequire
      } = createHelpers(loaderContext)

      const getRequireByType = (type) => {
        const src = typeResourceMap[type]
        const part = { src }
        const extraOptions = {
          ...queryObj,
          resourcePath
        }

        switch (type) {
          case 'template':
            if (ctorType === 'app') return ''
            Object.assign(extraOptions, {
              hasScoped,
              hasComment,
              isNative,
              ctorType,
              moduleId,
              componentGenerics,
              componentPlaceholder,
              usingComponentsInfo: JSON.stringify(usingComponentsInfo)
            })
            break
          case 'styles':
            if (cssLang) part.lang = cssLang
            Object.assign(extraOptions, {
              moduleId,
              scoped: hasScoped
            })
            break
          case 'json':
            if (useJSONJS) part.useJSONJS = true
            break
        }
        return getRequire(type, part, extraOptions)
      }

      // 注入模块id及资源路径
      let output = `global.currentModuleId = ${JSON.stringify(moduleId)}\n`
      if (!isProduction) {
        output += `global.currentResource = ${JSON.stringify(filePath)}\n`
      }

      output += `global.currentCtor = ${ctor}\n`
      output += `global.currentCtorType = ${JSON.stringify(ctor.replace(/^./, (match) => {
        return match.toLowerCase()
      }))}\n`
      output += `global.currentResourceType = ${JSON.stringify(ctorType)}\n`

      if (srcMode) {
        output += `global.currentSrcMode = ${JSON.stringify(srcMode)}\n`
      }

      for (const type in typeResourceMap) {
        output += `/* ${type} */\n${getRequireByType(type)}\n\n`
      }

      callback(null, output)
    }
  ], nativeCallback)
}
