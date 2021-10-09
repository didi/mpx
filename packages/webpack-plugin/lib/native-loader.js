const path = require('path')
const JSON5 = require('json5')
const parseRequest = require('./utils/parse-request')
const config = require('./config')
const createHelpers = require('./helpers')
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
  const filePath = this.resourcePath
  const moduleId = 'm' + mpx.pathHash(filePath)
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const mode = mpx.mode
  const defs = mpx.defs
  const globalSrcMode = mpx.srcMode
  const localSrcMode = queryObj.mode
  const packageName = queryObj.packageRoot || mpx.currentPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const parsed = path.parse(resourcePath)
  const resourceName = path.join(parsed.dir, parsed.name)
  const isApp = !pagesMap[resourcePath] && !componentsMap[resourcePath]
  const srcMode = localSrcMode || globalSrcMode
  const fs = this._compiler.inputFileSystem
  const typeExtMap = config[srcMode].typeExtMap
  const typeResourceMap = {}
  const autoScope = matchCondition(resourcePath, mpx.autoScopeRules)

  const EXT_MPX_JSON = '.json.js'
  const CSS_LANG_EXT_MAP = {
    less: '.less',
    stylus: '.styl',
    sass: '.sass',
    scss: '.scss'
  }

  let useMPXJSON = false
  let cssLang = ''
  const hasScoped = (queryObj.scoped || autoScope) && mode === 'ali'
  const hasComment = false
  const isNative = true

  const tryEvalMPXJSON = (callback) => {
    const { rawResourcePath } = parseRequest(typeResourceMap['json'])
    const _src = rawResourcePath
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

  const checkFileExists = (extName, callback) => {
    this.resolve(parsed.dir, resourceName + extName, (err, result) => {
      err = null
      callback(err, result)
    })
  }

  function checkCSSLangFiles (callback) {
    const langs = mpx.nativeOptions.cssLangs || ['less', 'stylus', 'scss', 'sass']
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
          typeResourceMap.styles = results[i]
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
        typeResourceMap.json = result
        useMPXJSON = true
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
          if (!err && result) {
            typeResourceMap[key] = result
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
        if (typeResourceMap['json']) {
          // eslint-disable-next-line handle-callback-err
          const { rawResourcePath } = parseRequest(typeResourceMap['json'])
          fs.readFile(rawResourcePath, (err, raw) => {
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
        getRequire
      } = createHelpers(loaderContext)

      const getRequireByType = (type) => {
        const src = typeResourceMap[type]
        const part = { src }
        const extraOptions = Object.assign({}, queryObj, {
          resourcePath
        })

        if (type !== 'script') this.addDependency(src)

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
      if (pagesMap[resourcePath]) {
        if (mpx.forceUsePageCtor || mode === 'ali' || mode === 'swan') {
          ctor = 'Page'
        } else {
          ctor = 'Component'
        }
      } else if (componentsMap[resourcePath]) {
        ctor = 'Component'
      }
      output += `global.currentCtor = ${ctor}\n`
      output += `global.currentCtorType = ${JSON.stringify(ctor.replace(/^./, (match) => {
        return match.toLowerCase()
      }))}\n`

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
