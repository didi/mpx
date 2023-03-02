import { genComponentTag } from '@mpxjs/compile-utils'
import { styleCompiler } from '@mpxjs/compiler'
import { proxyPluginContext } from '@mpxjs/plugin-proxy'
import { TransformPluginContext } from 'rollup'
import { Options } from '../../options'
import { TransformResult } from 'vite'
import pathHash from '../../utils/path-hash'
import { SFCDescriptor } from '../utils/descriptor-cache'
import { resolvedConfig } from '../config'
import mpx from '../mpx'

/**
 * transform style
 * @param code - style code
 * @param filename - filename
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
export async function transformStyle (
  code: string,
  filename: string,
  descriptor: SFCDescriptor,
  options: Options,
  pluginContext: TransformPluginContext
): Promise<TransformResult | undefined> {
  return styleCompiler.transform(code, proxyPluginContext(pluginContext), {
    sourceMap: resolvedConfig.sourceMap,
    map: pluginContext.getCombinedSourcemap(),
    resource: filename,
    mpx: {
      ...mpx,
      ...options,
      pathHash: pathHash,
      isApp: descriptor.app
    }
  })
}

/**
 * generate style block
 * @param descriptor - SFCDescriptor
 * @returns <style>descriptor.style</style>
 */
export function genStylesBlock (descriptor: SFCDescriptor): { output: string } {
  const { styles } = descriptor
  return { output: styles.map(style => genComponentTag(style)).join('\n') }
}
