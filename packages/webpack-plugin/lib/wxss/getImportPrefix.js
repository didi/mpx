/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
  Modified by @hiyuki
*/
var normalize = require('../utils/normalize')
var extractorPath = normalize.lib('extractor')

module.exports = function getImportPrefix (loaderContext, query) {
  if (query.importLoaders === false) {
    return ''
  }
  var importLoaders = parseInt(query.importLoaders, 10) || 0
  var loadersRequest = loaderContext.loaders.slice(
    loaderContext.loaderIndex,
    loaderContext.loaderIndex + 1 + importLoaders
  ).map(function (x) {
    return x.request
  }).join('!')
  if (query.extract) {
    loadersRequest = extractorPath +
      '?type=styles&index=-1&fromImport&resource=' +
      loaderContext.resource + '!' +
      loadersRequest
  }
  return '-!' + loadersRequest + '!'
}
