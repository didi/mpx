import parseRequest from '@mpxjs/utils/parse-request'
import mpx from '../mpx'
import { evalJSONJS } from '../../utils/evalJsonJs'
import resolve from './resolve'
import async from 'async'
import { JSON_JS_EXT } from '../../constants'
import { LoaderContext } from 'webpack'

module.exports = function getJSONContent(
  json: {
    src?: string
    content: string
    useJSONJS: boolean
  },
  loaderContext: LoaderContext<any>,
  callback: (err?: Error | null, content?: string) => void
) {
  if (!loaderContext._compiler) return callback(null, '{}')
  const fs = loaderContext._compiler.inputFileSystem
  async.waterfall(
    [
      (
        callback: (
          err?: Error | null,
          result?: { content: string; useJSONJS: boolean; filename: string }
        ) => void
      ) => {
        if (json.src) {
          resolve(
            loaderContext.context,
            json.src,
            loaderContext,
            (err, result) => {
              if (err) return callback(err)
              const { rawResourcePath: resourcePath } = parseRequest(result)
              fs.readFile(resourcePath, (err, content) => {
                if (err) return callback(err)
                callback(null, {
                  content: content?.toString('utf-8') || '',
                  useJSONJS:
                    json.useJSONJS || resourcePath.endsWith(JSON_JS_EXT),
                  filename: resourcePath
                })
              })
            }
          )
        } else {
          callback(null, {
            content: json.content,
            useJSONJS: json.useJSONJS,
            filename: loaderContext.resourcePath
          })
        }
      },
      (
        {
          content,
          useJSONJS,
          filename
        }: { content: string; useJSONJS: boolean; filename: string },
        callback: (err?: Error | null, content?: string) => void
      ) => {
        if (!content) return callback(null, '{}')
        if (useJSONJS) {
          content = JSON.stringify(
            evalJSONJS(
              content,
              filename,
              mpx.defs,
              loaderContext._compiler?.inputFileSystem,
              filename => {
                loaderContext.addDependency(filename)
              }
            )
          )
        }
        callback(null, content)
      }
    ],
    callback
  )
}
