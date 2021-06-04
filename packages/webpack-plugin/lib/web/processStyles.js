const loaderUtils = require('loader-utils')
const normalize = require('../utils/normalize')
const selectorPath = normalize.lib('selector')
module.exports = function (styles, options, callback) {
  let output = ''
  if (styles.length) {
    styles.forEach((style, i) => {
      const requestString = loaderUtils.stringifyRequest(options.ctx, `component.${style.lang || 'css'}!=!${selectorPath}?type=styles&index=${i}!${loaderUtils.getRemainingRequest(options.ctx)}`)
      output += `\n  import ${requestString}`
    })
    output += '\n'
  }
  callback(null, {
    output
  })
}
