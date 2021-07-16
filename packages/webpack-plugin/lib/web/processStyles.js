const genComponentTag = require('../utils/gen-component-tag')

module.exports = function (styles, options, callback) {
  let output = '/* styles */\n'
  if (styles.length) {
    styles.forEach((style) => {
      output += genComponentTag(style, {
        attrs (style) {
          const attrs = Object.assign({}, style.attrs)
          if (options.autoScope) attrs.scoped = true
          if (options.needCssSourceMap) attrs.needCssSourceMap = true
          if (options.moduleId) attrs.moduleId = options.moduleId
          return attrs
        }
      })
      output += '\n'
    })
    output += '\n'
  }
  callback(null, {
    output
  })
}
