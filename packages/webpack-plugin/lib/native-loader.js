const hash = require('hash-sum')
const path = require('path')
const getResourcePath = require('./utils/get-resource-path')
const loaderUtils = require('loader-utils')
const config = require('./config')
const createHelpers = require('./helpers')
const InjectDependency = require('./dependency/InjectDependency')
const stringifyQuery = require('./utils/stringify-query')
const mpxJSON = require('./utils/mpx-json')
const async = require('async')

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

  const context = (
    this.rootContext ||
    (this.options && this.options.context) ||
    process.cwd()
  )
  const shortFilePath = path.relative(context, filePath).replace(/^(\.\.[\\/])+/, '')
  const moduleId = hash(isProduction ? (shortFilePath + '\n' + content) : shortFilePath)

  const needCssSourceMap = (
    !isProduction &&
    this.sourceMap &&
    options.cssSourceMap !== false
  )

  const hasScoped = false
  const hasComment = false
  const isNative = true

  const projectRoot = mpx.projectRoot
  const mode = mpx.mode
  const globalSrcMode = mpx.srcMode
  const queryObj = loaderUtils.parseQuery(this.resourceQuery || '?')
  const localSrcMode = queryObj.mode
  const packageName = mpx.processingSubPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const resourcePath = getResourcePath(this.resource)
  const parsed = path.parse(resourcePath)
  const resourceName = path.join(parsed.dir, parsed.name)
  const isApp = !pagesMap[resourcePath] && !componentsMap[resourcePath]
  const srcMode = localSrcMode || globalSrcMode
  const fs = this._compiler.inputFileSystem
  const typeExtMap = Object.assign({}, config[srcMode].typeExtMap)

  function tryEvalMPXJSON (callback) {
    const _src = resourceName + EXT_MPX_JSON
    fs.readFile(_src, (err, raw) => {
      if (err) {
        callback(err)
      } else {
        try {
          const source = raw.toString('utf-8')
          const text = mpxJSON.compileMPXJSONText({ source, mode, filePath: _src })
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
          const resourcePath = resourceName + typeExtMap['json']
          fs.readFile(resourcePath, (err, raw) => {
            if (err) {
              callback(err)
            } else {
              const contentReplacer = mpx.contentReplacer
              callback(null, contentReplacer.replace({
                content: raw.toString('utf-8'),
                resourcePath
              }).content)
            }
          })
        } else {
          callback(null, '{}')
        }
      }
    }, (content, callback) => {
      let usingComponents = [].concat(mpx.usingComponents)
      try {
        let ret = JSON.parse(content)
        if (ret.usingComponents) {
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
          this.addDependency(_src)

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
