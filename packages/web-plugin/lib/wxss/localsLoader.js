/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
  Modified by @hiyuki
*/
var loaderUtils = require('loader-utils')
var processCss = require('./processCss')
var compileExports = require('./compile-exports')
var createResolver = require('./createResolver')

module.exports = function (content) {
  if (this.cacheable) this.cacheable()
  var callback = this.async()
  var query = loaderUtils.getOptions(this) || {}
  var moduleMode = query.modules || query.module
  var camelCaseKeys = query.camelCase || query.camelcase
  var resolve = createResolver(query.alias)

  processCss(content, null, {
    mode: moduleMode ? 'local' : 'global',
    query: query,
    minimize: this.minimize,
    loaderContext: this,
    resolve: resolve
  }, function (err, result) {
    if (err) return callback(err)

    function importItemMatcher (item) {
      var match = result.importItemRegExp.exec(item)
      var idx = +match[1]
      var importItem = result.importItems[idx]
      var importUrl = importItem.url
      return '" + require(' + loaderUtils.stringifyRequest(this, importUrl) + ')' +
        '[' + JSON.stringify(importItem.export) + '] + "'
    }

    var exportJs = compileExports(result, importItemMatcher.bind(this), camelCaseKeys)
    if (exportJs) {
      exportJs = 'module.exports = ' + exportJs + ';'
    }

    callback(null, exportJs)
  }.bind(this))
}
