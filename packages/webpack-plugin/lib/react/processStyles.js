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
  let output = '/* styles */\n'
  if (styles.length) {
    const warn = (msg) => {
      loaderContext.emitWarning(
        new Error('[Mpx style warning][' + loaderContext.resource + ']: ' + msg)
      )
    }
    const error = (msg) => {
      loaderContext.emitError(
        new Error('[Mpx style error][' + loaderContext.resource + ']: ' + msg)
      )
    }
    const { mode, srcMode, hasUnoCSS } = loaderContext.getMpx()
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
          result = result.map((item) => {
            return item[1]
          }).join('\n')
        }
        content += result.trim() + '\n'
        callback()
      }).catch((e) => {
        callback(e)
      })
      // require style
    }, (err) => {
      if (err) return callback(err)
      try {
        const classMap = getClassMap({
          content,
          filename: loaderContext.resourcePath,
          mode,
          srcMode,
          ctorType,
          warn,
          error
        })
        const classMapCode = Object.entries(classMap).reduce((result, [key, value]) => {
          result !== '' && (result += ',')
          result += `${isValidIdentifierStr(key) ? `${key}` : `['${key}']`}: () => (${shallowStringify(value)})`
          return result
        }, '')
        if (ctorType === 'app') {
          output += `
          global.__classCaches = global.__classCaches || [];
          const __classCache = new Map();
          global.__classCaches.push(__classCache);\n`

          if (hasUnoCSS) {
            output += `
            let __unoClassMap;
            global.__getUnoStyle = function(className) {
              if (!__unoClassMap) {
                __unoClassMap = {__unoCssMapPlaceholder__}
              }
              return global.__GCC(className, __unoClassMap, __classCache);
            };
            let __unoVarClassMap;
            global.__getUnoVarStyle = function(className) {
              if (!__unoVarClassMap) {
                __unoVarClassMap = {__unoVarUtilitiesCssMap__}
              }
              return global.__GCC(className, __unoVarClassMap, __classCache);
            };\n`
          }
          output += `
          let __appClassMap
          global.__getAppClassStyle = function(className) {
            if(!__appClassMap) {
              __appClassMap = {__unoCssMapPreflights__, ${classMapCode}};
            }
            return global.__GCC(className, __appClassMap, __classCache);
          };\n`
        } else {
          output += `
          global.__classCaches = global.__classCaches || []
          const __classCache = new Map()
          global.__classCaches.push(__classCache)
          let __classMap
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
