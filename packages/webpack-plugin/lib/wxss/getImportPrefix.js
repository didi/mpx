/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
  Modified by @hiyuki
*/
const normalize = require('../utils/normalize')
const extractorPath = normalize.lib('extractor')

module.exports = function getImportPrefix (loaderContext, extract) {
  const selectorIndex = loaderContext.loaders.findIndex(({ path }) => {
    return path.indexOf('@mpxjs/webpack-plugin/lib/selector') !== -1
  })
  let loadersRequest = loaderContext.loaders.slice(
    loaderContext.loaderIndex,
    selectorIndex !== -1 ? selectorIndex : undefined
  ).map(function (x) {
    return x.request
  }).join('!')
  if (extract) {
    loadersRequest = extractorPath + '?' +
      JSON.stringify({
        type: 'styles',
        index: -1,
        fromImport: true
      }) + '!' + loadersRequest
  }
  return '-!' + loadersRequest + '!'
}
