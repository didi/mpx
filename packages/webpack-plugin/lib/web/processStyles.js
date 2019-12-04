const genComponentTag = require('../utils/gen-component-tag')

module.exports = function (styles, options, callback) {
  const ctorType = options.ctorType
  let output = '/* styles */\n'

  if (ctorType === 'app') {
    styles.push({
      type: 'style',
      attrs: {
        src: '@mpxjs/webpack-plugin/lib/runtime/reset.css'
      }
    })
  }

  if (styles.length) {
    styles.forEach((style) => {
      output += genComponentTag(style)
      output += '\n'
    })
    output += '\n'
  }
  callback(null, {
    output
  })
}
