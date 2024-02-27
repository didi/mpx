const createHelpers = require('../helpers')

module.exports = function (styles, {
  loaderContext,
  ctorType,
  autoScope,
  moduleId
}, callback) {
  const { getRequire } = createHelpers(loaderContext)
  let output = '/* styles */\n'
  if (styles.length) {
    styles.forEach((style, i) => {
      const scoped = style.scoped || autoScope
      const extraOptions = {
        moduleId,
        scoped,
        extract: false
      }
      // require style
      output += getRequire('styles', style, extraOptions, i) + '\n'
    })
  }
  callback(null, {
    output
  })
}
