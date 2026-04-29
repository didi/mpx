const createHelpers = require('../helpers')
const async = require('async')
const getClassMap = require('./style-helper').getClassMap
const shallowStringify = require('../utils/shallow-stringify')
const isValidIdentifierStr = require('../utils/is-valid-identifier-str')

module.exports = function (styles, {
  loaderContext,
  ctorType,
  autoScope,
  moduleId
}, callback) {
  const { getRequestString } = createHelpers(loaderContext)
  let content = ''
  const styleResults = []
  let output = '/* styles */\n'
  if (styles.length) {
    const warn = (msg, loc) => {
      loaderContext.emitWarning(
        new Error('[Mpx style warning][' + (loc || loaderContext.resourcePath) + ']: ' + msg)
      )
    }
    const error = (msg, loc) => {
      loaderContext.emitError(
        new Error('[Mpx style error][' + (loc || loaderContext.resourcePath) + ']: ' + msg)
      )
    }
    const { mode, srcMode } = loaderContext.getMpx()
    async.eachOfSeries(styles, (style, i, callback) => {
      const scoped = style.scoped || autoScope
      const extraOptions = {
        moduleId,
        scoped,
        extract: false
      }
      // todo 建立新的request在内部导出classMap，便于样式模块复用
      loaderContext.importModule(JSON.parse(getRequestString('styles', style, extraOptions, i))).then((result) => {
        if (Array.isArray(result)) {
          result.forEach((item) => {
            const css = item[1]
            styleResults.push({
              content: css,
              map: item[3],
              filename: loaderContext.resourcePath
            })
            content += css.trim() + '\n'
          })
        } else {
          styleResults.push({
            content: result,
            filename: loaderContext.resourcePath
          })
          content += result.trim() + '\n'
        }
        callback()
      }).catch((e) => {
        callback(e)
      })
      // require style
    }, (err) => {
      if (err) return callback(err)
      try {
        output += `
          global.__classCaches = global.__classCaches || []
          var __classCache = new Map()
          global.__classCaches.push(__classCache)`
        const formatValueName = '_f'
        const classMap = getClassMap({
          content,
          styles: styleResults,
          filename: loaderContext.resourcePath,
          inputFileSystem: loaderContext._compiler && loaderContext._compiler.inputFileSystem,
          mode,
          srcMode,
          ctorType,
          warn,
          error,
          formatValueName
        })
        const classMapCode = Object.entries(classMap).reduce((result, [key, value]) => {
          result !== '' && (result += ',')
          result += `${isValidIdentifierStr(key) ? `${key}` : `['${key}']`}: function(${formatValueName}){return ${shallowStringify(value)};}`
          return result
        }, '')
        if (ctorType === 'app') {
          output += `
          var __appClassMap
          global.__getAppClassStyle = function(className) {
            if(!__appClassMap) {
              __appClassMap = {${classMapCode}};
            }
            return global.__GCC(className, __appClassMap, __classCache);
          };\n`
        } else {
          output += `
          var __classMap
          global.currentInject.injectMethods = {
            __getClassStyle: function(className) {
              if(!__classMap) {
                __classMap = {${classMapCode}};
              }
              return global.__GCC(className, __classMap, __classCache);
            }
          };\n`
        }
      } catch (e) {
        return callback(e)
      }
      callback(null, {
        output
      })
    })
  } else {
    callback(null, {
      output: ''
    })
  }
}
