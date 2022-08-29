const parseRequest = require('@mpxjs/utils/parse-request')
const mpx = require('../mpx')
const { evalJSONJS } = require('../../utils/evalJsonJs')
const resolve = require('./resolve')
const async = require('async')
const { JSON_JS_EXT } = require('./const')

module.exports = function getJSONContent (json, loaderContext, callback) {
  if (!loaderContext._compiler) return callback(null, '{}')
  const fs = loaderContext._compiler.inputFileSystem
  async.waterfall([
    (callback) => {
      if (json.src) {
        resolve(loaderContext.context, json.src, loaderContext, (err, result) => {
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
        content = JSON.stringify(evalJSONJS(content, filename, mpx.defs, loaderContext._compiler.inputFileSystem, (filename) => {
          loaderContext.addDependency(filename)
        }))
      }
      callback(null, content)
    }
  ], callback)
}
