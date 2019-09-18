module.exports = function (content) {
  const loaderContext = this
  loaderContext.cacheable()

  const mpx = loaderContext._compilation.__mpx__
  const callback = loaderContext.async()
  const contentReplacer = mpx.contentReplacer
  contentReplacer.replace({
    content,
    resourcePath: loaderContext.resourcePath
  })
    .then(newContent => callback(null, newContent), callback)
}
