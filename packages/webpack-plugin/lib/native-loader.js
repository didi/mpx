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

const EXT_MPX_JSON = '.json.js'

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
  const typeExtMap = Object.assign({}, config[srcMode].typeExtMap)
  const autoScope = matchCondition(resourcePath, mpx.autoScopeRules)

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

  let useMPXJSON = false

  // 先读取json获取usingComponents信息
  async.waterfall([
    (callback) => {
      fs.stat(resourceName + EXT_MPX_JSON, (err) => {
        if (!err) {
          useMPXJSON = true
        }
        callback()
      })
    },
    (callback) => {
      async.forEachOf(typeExtMap, (ext, key, callback) => {
        if (key === 'json' && useMPXJSON) {
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
      // 对原生写法增强json写法，可以用js来写json，尝试找.mpxjson.js文件，找不到用回json的内容
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
        if (type === 'json') {
          localQuery.__component = true
        }
        src += stringifyQuery(localQuery)

        if (type === 'script') {
          return getNamedExportsForSrc(type, { src })
        } else if (type === 'styles' && hasScoped) {
          return getRequireForSrc(type, { src }, 0, true)
        } else {
          return getRequireForSrc(type, { src })
        }
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

      if (isApp && mode === 'swan') {
        // 注入swan runtime fix
        globalInjectCode += 'if (!global.navigator) {\n' +
          '  global.navigator = {};\n' +
          '}\n' +
          'global.navigator.standalone = true;\n'
      }

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
        if (type === 'json' && useMPXJSON) {
          // 用了MPXJSON的话，强制生成目标json
          let _src = resourceName + EXT_MPX_JSON
          let localQuery = Object.assign({}, queryObj)
          localQuery.resourcePath = resourcePath
          localQuery.__component = true
          _src += stringifyQuery(localQuery)
          output += `/* MPX JSON */\n${getRequireForSrc('json', { src: _src })}\n\n`
          // 否则走原来的流程
        } else {
          output += `/* ${type} */\n${getRequire(type)}\n\n`
        }
      }

      callback(null, output)
    }
  ], nativeCallback)
}
