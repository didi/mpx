const parseRequest = require('./parse-request')
const mpxJSON = require('./mpx-json')
const getMainCompilation = require('./get-main-compilation')

module.exports = function readJsonForSrc (src, loaderContext, context, callback) {
  if (typeof context === 'function') {
    callback = context
    context = loaderContext.context
  }
  const fs = loaderContext._compiler.inputFileSystem
  const mpx = getMainCompilation(loaderContext._compilation).__mpx__
  const defs = mpx.defs
  const resolve = (context, request, callback) => {
    const { queryObj } = parseRequest(request)
    context = queryObj.context || context
    return loaderContext.resolve(context, request, callback)
  }

  resolve(context, src, (err, result) => {
    if (err) return callback(err)
    const { rawResourcePath: resourcePath } = parseRequest(result)
    loaderContext.addDependency(resourcePath)
    fs.readFile(resourcePath, (err, content) => {
      if (err) {
        return callback(err)
      }
      content = content.toString('utf-8')
      if (resourcePath.endsWith('.json.js')) {
        try {
          content = mpxJSON.compileMPXJSONText({ source: content, defs, filePath: resourcePath })
        } catch (e) {
          return callback(e)
        }
      }
      callback(null, content)
    })
  })
}
