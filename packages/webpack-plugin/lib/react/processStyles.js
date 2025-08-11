const createHelpers = require('../helpers')
const async = require('async')
const getClassMap = require('./style-helper').getClassMap
const shallowStringify = require('../utils/shallow-stringify')

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
        new Error('[style compiler][' + loaderContext.resource + ']: ' + msg)
      )
    }
    const error = (msg) => {
      loaderContext.emitError(
        new Error('[style compiler][' + loaderContext.resource + ']: ' + msg)
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
          warn,
          error
        })
        if (ctorType === 'app') {
          const classMapCode = Object.entries(classMap).reduce((result, [key, value]) => {
            result += `get ['${key}']() {
            return __getAppCacheClass('${key}', ${() => shallowStringify(value)});
          },`
            return result
          }, '')
          output += `
          let __appClassMap
          global.__appClassMapValueCache = new Map();
          function __getAppCacheClass(className, getStyleObj) {
            if (!global.__appClassMapValueCache.get(className)) {
              const styleObj = getStyleObj();
              global.__appClassMapValueCache.set(className, styleObj);
            }
            return global.__appClassMapValueCache.get(className);
          };
          global.__getAppClassMap = function() {
            if(!__appClassMap) {
              __appClassMap = {${classMapCode}};
            }
            return __appClassMap;
          };\n`
        } else {
          const classMapCode = Object.entries(classMap).reduce((result, [key, value]) => {
            result += `get ['${key}']() {
              return __getCacheClass('${key}', ${() => shallowStringify(value)});
          },`
            return result
          }, '')
          output += `
          let __classMap
          let __classMapValueCache = new Map();
          function __getCacheClass(className, getStyleObj) {
            if (!__classMapValueCache.get(className)) {
              const styleObj = getStyleObj();
              __classMapValueCache.set(className, styleObj);
            }
            return __classMapValueCache.get(className);
          }
          global.currentInject.injectOptions = {
            __classMapValueCache
          };
          global.currentInject.injectMethods = {
            __getClassMap: function() {
              if(!__classMap) {
                __classMap = {${classMapCode}};
              }
              return __classMap;
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
