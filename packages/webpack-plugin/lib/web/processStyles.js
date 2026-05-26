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
            scoped: attrs.scoped,
            // query中包含module字符串会被新版vue-cli中的默认rules当做css-module处理
            mid: options.moduleId
          })
          delete attrs.scoped
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
