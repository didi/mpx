const path = require('path')
const normalize = require('./utils/normalize')
const extractorPath = normalize.lib('extractor')
const stripExtension = require('./utils/strip-extention')
const jsonCompilerPath = normalize.lib('json-compiler/index')

module.exports = function (content) {
  this.cacheable()
  const isProduction = this.minimize || process.env.NODE_ENV === 'production'
  let cssLoaderOptions = ''
  if (isProduction) {
    cssLoaderOptions += (cssLoaderOptions ? '&' : '?') + 'minimize'
  }

  const defaultLoaders = {
    template: 'html-loader?attrs=audio:src image:src video:src cover-image:src',
    styles: 'css-loader' + cssLoaderOptions,
    json: jsonCompilerPath
  }
  const relativeFiles = {
    styles: '.wxss',
    json: '.json',
    template: '.wxml'
  }
  const baseRequest = stripExtension(this.resourcePath)

  function getExtractorString (type, index) {
    return (
      extractorPath +
      '?type=' +
      (type === 'script' || type === 'template' || type === 'styles' || type === 'json'
        ? type
        : 'customBlocks') +
      '&index=' + index +
      '!'
    )
  }

  function getRelativeRequire (type) {
    let requestString = baseRequest + relativeFiles[type]
    if (type === 'json') {
      requestString = requestString + '?__component'
    }
    if (defaultLoaders[type]) {
      requestString = defaultLoaders[type] + '!' + requestString
    }
    requestString = '!!' + getExtractorString(type, 0) + '!' + requestString
    return `require('${requestString}')\n`
  }

  for (let type in relativeFiles) {
    content = getRelativeRequire(type) + '\n' + content
  }

  return content
}
