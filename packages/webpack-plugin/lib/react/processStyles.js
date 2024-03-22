const createHelpers = require('../helpers')
const async = require('async')

module.exports = function (styles, {
  loaderContext,
  ctorType,
  autoScope,
  moduleId
}, callback) {
  const { getRequestString } = createHelpers(loaderContext)
  let content = ''
  if (styles.length) {
    async.eachOfSeries(styles, (style, i, callback) => {
      const scoped = style.scoped || autoScope
      const extraOptions = {
        moduleId,
        scoped,
        extract: false
      }
      loaderContext.importModule(JSON.parse(getRequestString('styles', style, extraOptions, i))).then((result) => {
        if (Array.isArray(result)) {
          result = result.map((item) => {
            return item[1]
          }).join('\n')
        }
        content += result.trim() + '\n'
        callback()
      }).catch(callback)
      // require style
    }, (err) => {
      if (err) return callback(err)
      // todo postcss
      callback(null, {
        output: ''
      })
    })
  } else {
    callback(null, {
      output: ''
    })
  }
}
