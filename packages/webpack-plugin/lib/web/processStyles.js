const genComponentTag = require('../utils/gen-component-tag')

module.exports = function (styles, callback) {
  let output = '/* styles */\n'

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
