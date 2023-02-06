import { JsonConfig } from '../types/json-config';
import getJSONContent from './get-json-content'
import { proxyPluginContext } from '@mpxjs/plugin-proxy'
import { TransformPluginContext } from 'rollup'
import { Options } from '../options'
import json5 from 'json5'
import fs from 'fs'
import { CompilerResult } from '@mpxjs/compiler';

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
): Promise<JsonConfig> {
  const { json } = compilerResult
  let content = json?.content || '{}'
  content = await getJSONContent(
    json,
    context,
    proxyPluginContext(pluginContext),
    options,
    fsInfo || fs
  )
  return json5.parse(content)
}
