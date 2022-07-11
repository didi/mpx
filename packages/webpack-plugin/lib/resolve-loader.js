module.exports = function () {
  return `
  var currentURL = global.currentPagePath
  var getRelativePath = require('@mpxjs/webpack-plugin/lib/utils/get-relative-path').getRelativePath
  module.exports = __mpx_resolve_path__(${JSON.stringify(this.resource)})`
}
