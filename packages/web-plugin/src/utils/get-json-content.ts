import parseRequest from '@mpxjs/utils/parse-request'
import { promisify } from 'util'
import path from 'path'
import { JSON_JS_EXT } from '../constants'
import { PluginContext } from '../pluginContextProxy'

export function evalJSONJS(
  source: string,
  filename: string,
  defs: Record<string, any>,
  fs: any,
  callback: (filename: string) => void
): Record<string, { exports: any }> {
  const defKeys = Object.keys(defs)
  const defValues = defKeys.map(key => {
    return defs[key]
  })
  const dirname = path.dirname(filename)
  // eslint-disable-next-line no-new-func
  const func = new Function(
    'module',
    'exports',
    'require',
    '__filename',
    '__dirname',
    ...defKeys,
    source
  )
  const module = {
    exports: {}
  }
  // 此处采用readFileSync+evalJSONJS而不直接使用require获取依赖内容有两个原因：
  // 1. 支持依赖中正常访问defs变量
  // 2. 避免对应的依赖文件被作为buildDependencies
  func(
    module,
    module.exports,
    function (request: string) {
      if (request.startsWith('.')) {
        request = path.join(dirname, request)
      }
      const filename = require.resolve(request)
      callback(filename)
      const source = fs.readFileSync(filename).toString('utf-8')
      return evalJSONJS(source, filename, fs, defs, callback)
    },
    filename,
    dirname,
    ...defValues
  )

  return module.exports
}

export default async function getJSONContent(
  json: {
    src?: string
    content: string
    useJSONJS: boolean
  },
  filename: string,
  pluginContext: PluginContext,
  defs: Record<string, any>,
  fs: any
): Promise<string> {
  let jsonContent = json.content
  let useJSONJS = json.useJSONJS
  let resourcePath = ''
  if (json.src) {
    const jsonPath = await pluginContext.resolve(json.src, filename)
    if (jsonPath) {
      const { rawResourcePath } = parseRequest(jsonPath.id)
      useJSONJS = rawResourcePath.endsWith(JSON_JS_EXT)
      const readFile = promisify(fs.readFile)
      jsonContent = await readFile(rawResourcePath,'utf-8')
      resourcePath = rawResourcePath
    }
  }
  if (useJSONJS) {
    return JSON.stringify(
      evalJSONJS(jsonContent, resourcePath, defs, fs, filename => {
        pluginContext.addWatchFile(filename)
      })
    )
  }
  return jsonContent
}
