const path = require('path')
const JSON5 = require('json5')
const parseRequest = require('./utils/parse-request')
const loaderUtils = require('loader-utils')
const config = require('./config')
const createHelpers = require('./helpers')
const InjectDependency = require('./dependency/InjectDependency')
const stringifyQuery = require('./utils/stringify-query')
const mpxJSON = require('./utils/mpx-json')
const async = require('async')
const matchCondition = require('./utils/match-condition')
const fixUsingComponent = require('./utils/fix-using-component')
const getMainCompilation = require('./utils/get-main-compilation')

module.exports = function (content) {
  this.cacheable()

  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__
  if (!mpx) {
    return content
  }

  const nativeCallback = this.async()

  const loaderContext = this
  const isProduction = this.minimize || process.env.NODE_ENV === 'production'
  const options = Object.assign({}, mpx.loaderOptions, loaderUtils.getOptions(this))

  const filePath = this.resourcePath

  const moduleId = 'm' + mpx.pathHash(filePath)
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const projectRoot = mpx.projectRoot
  const mode = mpx.mode
  const defs = mpx.defs
  const globalSrcMode = mpx.srcMode
  const localSrcMode = queryObj.mode
  const packageName = queryObj.packageName || mpx.currentPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const parsed = path.parse(resourcePath)
  const resourceName = path.join(parsed.dir, parsed.name)
  const isApp = !pagesMap[resourcePath] && !componentsMap[resourcePath]
  const srcMode = localSrcMode || globalSrcMode
  const fs = this._compiler.inputFileSystem
  const originTypeExtMap = config[srcMode].typeExtMap
  const typeExtMap = Object.assign({}, originTypeExtMap)
  const typeExtRawResourcePathMap = {}
  const autoScope = matchCondition(resourcePath, mpx.autoScopeRules)

  const EXT_MPX_JSON = '.json.js'
  const CSS_LANG_EXT_MAP = {
    less: '.less',
    stylus: '.styl',
    sass: '.sass',
    scss: '.scss',
    css: originTypeExtMap.styles
  }

  let useMPXJSON = false
  let cssLang = ''
  const hasScoped = (queryObj.scoped || autoScope) && mode === 'ali'
  const hasComment = false
  const isNative = true

  const tryEvalMPXJSON = (callback) => {
    const _src = typeExtRawResourcePathMap['json']
    this.addDependency(_src)
    fs.readFile(_src, (err, raw) => {
      if (err) {
        callback(err)
      } else {
        try {
          const source = raw.toString('utf-8')
          const text = mpxJSON.compileMPXJSONText({ source, defs, filePath: _src })
          callback(null, text)
        } catch (e) {
          callback(e)
        }
      }
    })
  }

  function checkFileExists (extName, callback) {
    this.resolve(parsed.dir, resourceName + extName, (err, result) => {
      err = null
      callback(err, result)
    })
  }

  function checkCSSLangFiles (callback) {
    const langs = mpx.nativeOptions.cssLangs || ['css', 'less', 'stylus', 'scss', 'sass']
    const results = []
    async.eachOf(langs, function (lang, i, callback) {
      if (!CSS_LANG_EXT_MAP[lang]) {
        return callback()
      }
      checkFileExists(CSS_LANG_EXT_MAP[lang], (err, result) => {
        if (!err && result) {
          results[i] = result
        }
        callback(err)
      })
    }, function (err) {
      for (let i = 0; i < langs.length; i++) {
        if (results[i]) {
          cssLang = langs[i]
          typeExtMap.styles = CSS_LANG_EXT_MAP[cssLang]
          typeExtRawResourcePathMap.styles = results[i]
          break
        }
      }
      callback(err)
    })
  }

  function checkMPXJSONFile (callback) {
    // checkFileExists(EXT_MPX_JSON, (err, result) => {
    checkFileExists(EXT_MPX_JSON, (err, result) => {
      if (!err && result) {
        const { rawResourcePath } = parseRequest(result)
        typeExtRawResourcePathMap.json = rawResourcePath
        useMPXJSON = true
        typeExtMap.json = EXT_MPX_JSON
      }
      callback(err)
    })
  }

  // 先读取json获取usingComponents信息
  async.waterfall([
    (callback) => {
      async.parallel([
        checkCSSLangFiles,
        checkMPXJSONFile
      ], (err) => {
        callback(err)
      })
    },
    (callback) => {
      async.forEachOf(typeExtMap, (ext, key, callback) => {
        // 检测到mpxJson或cssLang时跳过对应类型文件检测
        if ((key === 'json' && useMPXJSON) || (key === 'styles' && cssLang)) {
          return callback()
        }
        checkFileExists(ext, (err, result) => {
          if (!err && !result) {
            delete typeExtMap[key]
          }
          if (!err && result) {
            typeExtRawResourcePathMap[key] = result
          }
          callback(err)
        })
      }, callback)
    },
    (callback) => {
      // 对原生写法增强json写法，可以用js来写json，尝试找.json.js文件，找不到用回json的内容
      if (useMPXJSON) {
        tryEvalMPXJSON(callback)
      } else {
        if (typeExtMap['json']) {
          // eslint-disable-next-line handle-callback-err
          fs.readFile(typeExtRawResourcePathMap['json'], (err, raw) => {
            if (err) {
              callback(err)
            } else {
              callback(null, raw.toString('utf-8'))
            }
          })
        } else {
          callback(null, '{}')
        }
      }
    }, (content, callback) => {
      let usingComponents = [].concat(Object.keys(mpx.usingComponents))
      try {
        let ret = JSON5.parse(content)
        if (ret.usingComponents) {
          fixUsingComponent(ret.usingComponents, mode)
          usingComponents = usingComponents.concat(Object.keys(ret.usingComponents))
        }
      } catch (e) {
      }
      const {
        getRequireForSrc,
        getNamedExportsForSrc
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

      const getRequire = (type) => {
        const localQuery = Object.assign({}, queryObj)
        let src = typeExtRawResourcePathMap[type]
        localQuery.resourcePath = resourcePath
        if (type !== 'script') {
          this.addDependency(src)
        }
        if (type === 'template' && isApp) {
          return ''
        }
        if (type === 'json' && !useMPXJSON) {
          localQuery.__component = true
        }
        src += stringifyQuery(localQuery)

        const partsOpts = { src }

        if (type === 'script') {
          return getNamedExportsForSrc(type, partsOpts)
        }
        if (type === 'styles') {
          if (cssLang !== 'css') {
            partsOpts.lang = cssLang
          }
          if (hasScoped) {
            return getRequireForSrc(type, partsOpts, 0, true)
          }
        }
        return getRequireForSrc(type, partsOpts)
      }

      // 注入模块id及资源路径
      let globalInjectCode = `global.currentModuleId = ${JSON.stringify(moduleId)}\n`
      if (!isProduction) {
        globalInjectCode += `global.currentResource = ${JSON.stringify(filePath)}\n`
      }

      // 注入构造函数
      let ctor = 'App'
      if (pagesMap[resourcePath]) {
        if (mpx.forceUsePageCtor || mode === 'ali') {
          ctor = 'Page'
        } else {
          ctor = 'Component'
        }
      } else if (componentsMap[resourcePath]) {
        ctor = 'Component'
      }
      globalInjectCode += `global.currentCtor = ${ctor}\n`
      globalInjectCode += `global.currentCtorType = ${JSON.stringify(ctor.replace(/^./, (match) => {
        return match.toLowerCase()
      }))}\n`

      if (srcMode) {
        globalInjectCode += `global.currentSrcMode = ${JSON.stringify(srcMode)}\n`
      }

      if (!mpx.forceDisableInject) {
        const dep = new InjectDependency({
          content: globalInjectCode,
          index: -3
        })
        this._module.addDependency(dep)
      }

      // 触发webpack global var 注入
      let output = 'global.currentModuleId;\n'

      for (let type in typeExtMap) {
        output += `/* ${type} */\n${getRequire(type)}\n\n`
      }

      callback(null, output)
    }
  ], nativeCallback)
}
