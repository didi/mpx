import { TransformPluginContext } from 'rollup'
import fs from 'fs'
import json5 from 'json5'
import mpxJSON from '@mpxjs/webpack-plugin/lib/utils/mpx-json'
import { ResolvedOptions } from '../index'
import { SFCDescriptor } from '../compiler'

export interface JsonConfig {
  component: boolean
  usingComponents?: Record<string, string>
  componentGenerics?: Record<string, { default?: string }>
  pages: string[]
  tabBar?: {
    custom?: boolean
    color?: string
    selectedColor?: string
    backgroundColor?: string
    list?: {
      pagePath: string
      text: string
    }[]
  }
  networkTimeout?: {
    request: number
    connectSocket: number
    uploadFile: number
    downloadFile: number
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window: any
  style: string
}

export default async function resolveJsonFile(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<JsonConfig> {
  const { defs } = options
  const { json } = descriptor
  let content = json?.content || '{}'
  if (json?.src) {
    const resolveId = await pluginContext.resolve(json.src, descriptor.filename)
    if (resolveId) {
      pluginContext.addWatchFile(resolveId.id)
      content = fs.readFileSync(resolveId.id, 'utf-8')
      if (resolveId.id.endsWith('.json.js')) {
        content = mpxJSON.compileMPXJSONText({
          source: content,
          defs,
          filePath: resolveId.id
        })
      }
    }
  }
  return json5.parse(content)
}
