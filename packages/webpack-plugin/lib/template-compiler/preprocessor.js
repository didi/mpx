// loader for pre-processing templates with e.g. pug

const cons = require('consolidate')
const loaderUtils = require('loader-utils')

module.exports = function (content) {
  this.cacheable && this.cacheable()
  const callback = this.async()
  const opt = loaderUtils.getOptions(this) || {}

  if (!cons[opt.engine]) {
    return callback(new Error(
      'Template engine \'' + opt.engine + '\' ' +
      'isn\'t available in Consolidate.js'
    ))
  }

  const templateOption = opt.templateOption

  // for relative includes
  templateOption.filename = this.resourcePath

  cons[opt.engine].render(content, templateOption, function (err, html) {
    if (err) {
      return callback(err)
    }
    callback(null, html)
  })
}
