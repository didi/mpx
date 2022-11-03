/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
  Modified by @hiyuki
*/
const loaderUtils = require('loader-utils')
const processCss = require('./processCss')
const compileExports = require('./compile-exports')
const createResolver = require('./createResolver')

module.exports = function (content) {
  if (this.cacheable) this.cacheable()
  const callback = this.async()
  const query = loaderUtils.getOptions(this) || {}
  const moduleMode = query.modules || query.module
  const camelCaseKeys = query.camelCase || query.camelcase
  const resolve = createResolver(query.alias)

  processCss(content, null, {
    mode: moduleMode ? 'local' : 'global',
    query: query,
    minimize: this.minimize,
    loaderContext: this,
    resolve: resolve
  }, function (err, result) {
    if (err) return callback(err)

    function importItemMatcher (item) {
      const match = result.importItemRegExp.exec(item)
      const idx = +match[1]
      const importItem = result.importItems[idx]
      const importUrl = importItem.url
      return '" + require(' + loaderUtils.stringifyRequest(this, importUrl) + ')' +
        '[' + JSON.stringify(importItem.export) + '] + "'
    }

    let exportJs = compileExports(result, importItemMatcher.bind(this), camelCaseKeys)
    if (exportJs) {
      exportJs = 'module.exports = ' + exportJs + ';'
    }

    callback(null, exportJs)
  }.bind(this))
}
