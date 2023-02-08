import { parseRequest } from '@mpxjs/compile-utils'
import { CompilerResult } from '@mpxjs/compiler'
import { proxyPluginContext, ProxyPluginContext } from '@mpxjs/plugin-proxy'
import fs from 'fs'
import json5 from 'json5'
import path from 'path'
import { TransformPluginContext } from 'rollup'
import { promisify } from 'util'
import { DEFAULT_TAB_BAR_CONFIG, JSON_JS_EXT } from '../constants'
import { Options } from '../options'
import { JsonConfig } from '../types/json-config'

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
      return evalJSONJS(source, filename, fs, defs || {}, callback)
    },
    filename,
    dirname,
    ...defValues
  )

  return module.exports
}

export async function getJSONContent(
  json: CompilerResult['json'],
  filename: string,
  pluginContext: ProxyPluginContext,
  defs: Record<string, any> | unknown,
  fs: any
) {
  let jsonPath = filename
  if (json) {
    let jsonContent = json.content
    let useJSONJS = json.useJSONJS
    let resourcePath = ''
    if (json.src) {
      const resolvedJsonPath = await pluginContext.resolve(json.src, filename)
      if (resolvedJsonPath) {
        const { rawResourcePath } = parseRequest(resolvedJsonPath.id)
        jsonPath = resolvedJsonPath.id
        useJSONJS = rawResourcePath.endsWith(JSON_JS_EXT)
        const readFile = promisify(fs.readFile)
        jsonContent = await readFile(rawResourcePath, 'utf-8')
        json.content = jsonContent
        resourcePath = rawResourcePath
        pluginContext.addDependency(resolvedJsonPath.id)
      }
    }
    if (useJSONJS) {
      return {
        content: JSON.stringify(
          evalJSONJS(jsonContent, resourcePath, defs || {}, fs, filename => {
            pluginContext.addDependency(filename)
          })
        ),
        path: jsonPath
      }
    }
    return {
      content: jsonContent,
      path: jsonPath
    }
  }
  return {
    content: '{}',
    path: jsonPath
  }
}

/**
 * resolve json content
 * @param descriptor - SFCDescriptor
 * @param pluginContext - TransformPluginContext
 * @param options - ResolvedOptions
 * @returns json config
 */
export default async function resolveJson(
  compilerResult: CompilerResult,
  context: string,
  pluginContext: TransformPluginContext,
  options: Options,
  fsInfo?: any
): Promise<JsonConfig & { path: string }> {
  const { json } = compilerResult
  const jsonContent = await getJSONContent(
    json,
    context,
    proxyPluginContext(pluginContext),
    options,
    fsInfo || fs
  )
  const jsonResult = json5.parse(jsonContent.content)
  if (jsonResult.tabBar) {
    jsonResult.tabBar = {
      ...DEFAULT_TAB_BAR_CONFIG,
      ...jsonResult.tabBar
    }
  }
  return {
    ...jsonResult,
    path: jsonContent.path
  }
}
