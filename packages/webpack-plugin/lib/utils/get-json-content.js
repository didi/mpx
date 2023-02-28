const parseRequest = require('./parse-request')
const evalJSONJS = require('./eval-json-js')
const resolve = require('./resolve')
const async = require('async')
const { JSON_JS_EXT } = require('./const')
const path = require('path')

module.exports = function getJSONContent (json, filename, loaderContext, callback) {
  if (!loaderContext._compiler) return callback(null, '{}')
  const fs = loaderContext._compiler.inputFileSystem
  filename = filename || loaderContext.resourcePath
  const context = path.dirname(filename)

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
          filename
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
