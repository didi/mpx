import { SFCDescriptor } from '../types/compiler';
import { JsonConfig } from '../types/json-config';
import getJSONContent from './get-json-content'
import { proxyPluginContext } from '@mpxjs/plugin-proxy'
import { TransformPluginContext } from 'rollup'
import { Options } from '../options'
import json5 from 'json5'
import fs from 'fs'

/**
 * resolve json content
 * @param descriptor - SFCDescriptor
 * @param pluginContext - TransformPluginContext
 * @param options - ResolvedOptions
 * @returns json config
 */
export default async function resolveJson(
  descriptor: SFCDescriptor,
  context: string,
  pluginContext: TransformPluginContext,
  defs: Options['defs'],
  fsInfo?: any
): Promise<JsonConfig> {
  const { json } = descriptor
  let content = json?.content || '{}'
  if (json) {
    content = await getJSONContent(
      json,
      context,
      proxyPluginContext(pluginContext),
      defs,
      fsInfo || fs
    )
  }
  return json5.parse(content)
}
