const hash = require('hash-sum')
const path = require('path')
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

module.exports = function (content) {
  this.cacheable()

  const mpx = this._compilation.__mpx__
  if (!mpx) {
    return content
  }

  const nativeCallback = this.async()

  const loaderContext = this
  const isProduction = this.minimize || process.env.NODE_ENV === 'production'
  const options = loaderUtils.getOptions(this) || {}

  const filePath = this.resourcePath

  const moduleId = 'm' + hash(this._module.identifier())

  const projectRoot = mpx.projectRoot
  const mode = mpx.mode
  const defs = mpx.defs
  const globalSrcMode = mpx.srcMode
  const queryObj = loaderUtils.parseQuery(this.resourceQuery || '?')
  const localSrcMode = queryObj.mode
  const packageName = mpx.currentPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const resourcePath = parseRequest(this.resource).resourcePath
  const parsed = path.parse(resourcePath)
  const resourceName = path.join(parsed.dir, parsed.name)
  const isApp = !pagesMap[resourcePath] && !componentsMap[resourcePath]
  const srcMode = localSrcMode || globalSrcMode
  const fs = this._compiler.inputFileSystem
  const originTypeExtMap = config[srcMode].typeExtMap
  const typeExtMap = Object.assign({}, originTypeExtMap)
  const autoScope = matchCondition(resourcePath, mpx.autoScopeRules)

  const EXT_MPX_JSON = '.json.js'
  const CSS_LANG_EXT_MAP = {
    less: '.less',
    stylus: '.stly',
    sass: '.sass',
    scss: '.scss',
    // 空串，默认行为走css-loader
    css: originTypeExtMap.styles
  }

  let useMPXJSON = false
  let cssLang = ''

  const needCssSourceMap = (
    !isProduction &&
    this.sourceMap &&
    options.cssSourceMap !== false
  )
  const hasScoped = (queryObj.scoped || autoScope) && mode === 'ali'
  const hasComment = false
  const isNative = true

  const tryEvalMPXJSON = (callback) => {
    const _src = resourceName + EXT_MPX_JSON
    this.addDependency(_src)
    fs.readFile(_src, (err, raw) => {
      if (err) {
        callback(err)
      } else {
        try {
          const source = raw.toString('utf-8')
          const text = mpxJSON.compileMPXJSONText({ source, mode, defs, filePath: _src })
          callback(null, text)
        } catch (e) {
          callback(e)
        }
      }
    })
  }

  function checkFileExists (extName, callback) {
    fs.stat(resourceName + extName, (err) => {
      callback(null, !err)
    })
  }

  function checkCSSLangFiles (callback) {
    const langs = mpx.nativeOptions.cssLangs || ['stylus', 'less', 'sass', 'scss', 'css']
    const results = []
    async.eachOf(langs, function (lang, i, callback) {
      if (!CSS_LANG_EXT_MAP[lang]) {
        return callback()
      }
      checkFileExists(CSS_LANG_EXT_MAP[lang], (err, result) => {
        if (!err && result) {
          results[i] = true
        }
        callback()
      })
    }, function () {
      for (let i = 0; i < langs.length; i++) {
        if (results[i]) {
          cssLang = langs[i]
          typeExtMap.styles = CSS_LANG_EXT_MAP[cssLang]
          break
        }
      }
      callback()
    })
  }

  function checkMPXJSONFile (callback) {
    // checkFileExists(EXT_MPX_JSON, (err, result) => {
    checkFileExists(EXT_MPX_JSON, (err, result) => {
      if (!err && result) {
        useMPXJSON = true
        typeExtMap.json = EXT_MPX_JSON
      }
      callback()
    })
  }

  // 先读取json获取usingComponents信息
  async.waterfall([
    async.applyEach([
      checkMPXJSONFile,
      checkCSSLangFiles
    ]),
    (callback) => {
      async.forEachOf(typeExtMap, (ext, key, callback) => {
        // 检测到mpxjson或cssLang时跳过文件检测
        if ((key === 'json' && useMPXJSON) || (key === 'styles' && cssLang)) {
          return callback()
        }
        fs.stat(resourceName + ext, (err) => {
          if (err) {
            delete typeExtMap[key]
            callback()
          } else {
            callback()
          }
        })
      }, callback)
    },
    (callback) => {
      // 对原生写法增强json写法，可以用js来写json，尝试找.json.js文件，找不到用回json的内容
      if (useMPXJSON) {
        tryEvalMPXJSON(callback)
      } else {
        if (typeExtMap['json']) {
          const jsonSrc = resourceName + typeExtMap['json']
          this.addDependency(jsonSrc)
          fs.readFile(jsonSrc, (err, raw) => {
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
        let ret = JSON.parse(content)
        if (ret.usingComponents) {
          fixUsingComponent({ usingComponents: ret.usingComponents, mode })
          usingComponents = usingComponents.concat(Object.keys(ret.usingComponents))
        }
      } catch (e) {
      }
      const {
        getRequireForSrc,
        getNamedExportsForSrc
      } = createHelpers(
        loaderContext,
        options,
        moduleId,
        isProduction,
        hasScoped,
        hasComment,
        usingComponents,
        needCssSourceMap,
        srcMode,
        isNative,
        projectRoot
      )

      const getRequire = (type) => {
        let localQuery = Object.assign({}, queryObj)
        let src = resourceName + typeExtMap[type]
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
      let globalInjectCode = `global.currentModuleId = ${JSON.stringify(moduleId)};\n`
      if (!isProduction) {
        globalInjectCode += `global.currentResource = ${JSON.stringify(filePath)};\n`
      }

      // 注入构造函数
      let ctor = 'App'
      if (pagesMap[resourcePath]) {
        ctor = mode === 'ali' ? 'Page' : 'Component'
      } else if (componentsMap[resourcePath]) {
        ctor = 'Component'
      }
      globalInjectCode += `global.currentCtor = ${ctor};\n`

      if (srcMode) {
        globalInjectCode += `global.currentSrcMode = ${JSON.stringify(srcMode)};\n`
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
