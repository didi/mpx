const path = require('path')
const JSON5 = require('json5')
const parseRequest = require('./utils/parse-request')
const config = require('./config')
const createHelpers = require('./helpers')
const getJSONContent = require('./utils/get-json-content')
const async = require('async')
const matchCondition = require('./utils/match-condition')
const fixUsingComponent = require('./utils/fix-using-component')
const { JSON_JS_EXT } = require('./utils/const')

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
  const moduleId = 'm' + mpx.pathHash(filePath)
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const mode = mpx.mode
  const globalSrcMode = mpx.srcMode
  const localSrcMode = queryObj.mode
  const packageName = queryObj.packageRoot || mpx.currentPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const parsed = path.parse(resourcePath)
  const resourceName = path.join(parsed.dir, parsed.name)
  const isApp = !(pagesMap[resourcePath] || componentsMap[resourcePath])
  const srcMode = localSrcMode || globalSrcMode
  const typeExtMap = config[srcMode].typeExtMap
  const typeResourceMap = {}
  const autoScope = matchCondition(resourcePath, mpx.autoScopeRules)

  const CSS_LANG_EXT_MAP = {
    less: '.less',
    stylus: '.styl',
    sass: '.sass',
    scss: '.scss'
  }

  let useJSONJS = false
  let cssLang = ''
  const hasScoped = (queryObj.scoped || autoScope) && mode === 'ali'
  const hasComment = false
  const isNative = true

  const checkFileExists = (extName, callback) => {
    this.resolve(parsed.dir, resourceName + extName, callback)
  }

  function checkCSSLangFiles (callback) {
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

  // 先读取json获取usingComponents信息
  async.waterfall([
    (callback) => {
      async.parallel([
        checkCSSLangFiles,
        checkJSONJSFile
      ], (err) => {
        callback(err)
      })
    },
    (callback) => {
      async.forEachOf(typeExtMap, (ext, key, callback) => {
        // 检测到jsonjs或cssLang时跳过对应类型文件检测
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
      }, this, callback)
    }, (content, callback) => {
      let json
      try {
        json = JSON5.parse(content)
      } catch (e) {
        return callback(e)
      }
      let usingComponents = Object.keys(mpx.usingComponents)
      if (json.usingComponents) {
        fixUsingComponent(json.usingComponents, mode)
        usingComponents = usingComponents.concat(Object.keys(json.usingComponents))
      }
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
            if (isApp) return ''
            Object.assign(extraOptions, {
              hasScoped,
              hasComment,
              isNative,
              moduleId,
              usingComponents
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

      // 注入构造函数
      let ctor = 'App'
      let ctorType = 'app'
      if (pagesMap[resourcePath]) {
        ctorType = 'page'
        if (mpx.forceUsePageCtor || mode === 'ali' || mode === 'swan') {
          ctor = 'Page'
        } else {
          ctor = 'Component'
        }
      } else if (componentsMap[resourcePath]) {
        ctor = 'Component'
        ctorType = 'component'
      }
      output += `global.currentCtor = ${ctor}\n`
      output += `global.currentCtorType = ${JSON.stringify(ctor.replace(/^./, (match) => {
        return match.toLowerCase()
      }))}\n`
      output += `global.currentResourceType = ${JSON.stringify(ctorType)}\n`

      if (srcMode) {
        output += `global.currentSrcMode = ${JSON.stringify(srcMode)}\n`
      }

      for (let type in typeResourceMap) {
        output += `/* ${type} */\n${getRequireByType(type)}\n\n`
      }

      callback(null, output)
    }
  ], nativeCallback)
}
