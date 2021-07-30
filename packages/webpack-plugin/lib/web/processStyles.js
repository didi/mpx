const genComponentTag = require('../utils/gen-component-tag')

module.exports = function (styles, options, callback) {
  let output = '/* styles */\n'
  if (styles.length) {
    styles.forEach((style) => {
      output += genComponentTag(style, {
        attrs (style) {
          const attrs = Object.assign({}, style.attrs)
          if (options.autoScope) attrs.scoped = true
          attrs.mpxStyleOptions = JSON.stringify({
            // scoped: !!options.autoScope,
            sourceMap: !!options.needCssSourceMap,
            moduleId: options.moduleId,
            transRpx: options.transRpx
          })
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
