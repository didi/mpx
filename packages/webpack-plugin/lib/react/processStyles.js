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
  let output = ''
  if (ctorType === 'app') {
    output += `
          /* styles */
          global.__classMapValueCache = new Map();
          global.__getCacheClass = function(className, getStyleObj) {
            if (!global.__classMapValueCache.get(className)) {
              const styleObj = getStyleObj();
              global.__classMapValueCache.set(className, styleObj);
            }
            return global.__classMapValueCache.get(className);
          };\n`
  }
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
        const classMapCode = Object.entries(classMap).reduce((result, [key, value]) => {
          result += `get ['${key}']() {
            return global.__getCacheClass('${key}', () => (${shallowStringify(value)}));
          },`
          return result
        }, '')
        if (ctorType === 'app') {
          output += `
          let __appClassMap
          global.__getAppClassMap = function() {
            if(!__appClassMap) {
              __appClassMap = {${classMapCode}};
            }
            return __appClassMap;
          };\n`
        } else {
          output += `
          /* styles */
          let __classMap
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
      output
    })
  }
}
