const parseRequest = require('./parse-request')

module.exports = function readJsonForSrc (src, loaderContext, callback) {
  const fs = loaderContext._compiler.inputFileSystem
  const resolve = (context, request, callback) => {
    const { queryObj } = parseRequest(request)
    context = queryObj.context || context
    return loaderContext.resolve(context, request, callback)
  }

  resolve(loaderContext, src, (err, result) => {
    if (err) return callback(err)
    const { resourcePath } = parseRequest(result)
    fs.readFile(resourcePath, callback)
  })
}
