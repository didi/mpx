import { genComponentTag } from '@mpxjs/compile-utils'
import { TransformPluginContext } from 'rollup'
import { TransformResult } from 'vite'
import { mpxStyleTransform } from '@mpxjs/loaders'
import { ResolvedOptions } from '../../options'
import { SFCDescriptor } from '../../types/compiler'
import { proxyPluginContext } from '../../pluginContextProxy'
import mpx from '../mpx'
import pathHash from '../../utils/pageHash'

/**
 * transform style
 * @param code - style code
 * @param filename - filename
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
export async function transformStyle(
  code: string,
  filename: string,
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<TransformResult | undefined> {
  return mpxStyleTransform(code, proxyPluginContext(pluginContext), {
    sourceMap: options.sourceMap,
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
export function genStylesBlock(descriptor: SFCDescriptor): { output: string } {
  const { styles } = descriptor
  return { output: styles.map(style => genComponentTag(style)).join('\n') }
}
