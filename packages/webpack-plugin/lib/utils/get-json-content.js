const parseRequest = require('./parse-request')
const evalJSONJS = require('./eval-json-js')
const resolve = require('./resolve')
const async = require('async')
const { JSON_JS_EXT } = require('./const')

module.exports = function getJSONContent (json, loaderContext, context, callback) {
  if (typeof context === 'function') {
    callback = context
    context = loaderContext.context
  }
  const fs = loaderContext._compiler.inputFileSystem
  async.waterfall([
    (callback) => {
      if (json.src) {
        resolve(context, json.src, loaderContext, (err, result) => {
          if (err) return callback(err)
          const { rawResourcePath: resourcePath } = parseRequest(result)
          fs.readFile(resourcePath, (err, content) => {
            if (err) return callback(err)
            callback(null, {
              content: content.toString('utf-8'),
              useJSONJS: json.useJSONJS || resourcePath.endsWith(JSON_JS_EXT),
              filename: resourcePath

            })
          })
        })
      } else {
        callback(null, {
          content: json.content,
          useJSONJS: json.useJSONJS,
          filename: loaderContext.resourcePath
        })
      }
    },
    ({ content, useJSONJS, filename }, callback) => {
      if (!content) return callback(null, '{}')
      if (useJSONJS) {
        content = JSON.stringify(evalJSONJS(content, filename, loaderContext))
      }
      callback(null, content)
    }
  ], callback)
}
