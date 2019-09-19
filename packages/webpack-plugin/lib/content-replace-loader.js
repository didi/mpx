const getMainCompilation = require('./utils/get-main-compilation')

module.exports = function (content) {
  const loaderContext = this
  loaderContext.cacheable()

  const mpx = getMainCompilation(loaderContext._compilation).__mpx__
  const contentReplacer = mpx.contentReplacer
  const { content: newContent } = contentReplacer.replace({
    content,
    resourcePath: loaderContext.resourcePath
  })
  return newContent
}
