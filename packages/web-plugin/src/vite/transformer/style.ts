import genComponentTag from '@mpxjs/compile-utils/gen-component-tag'
import { TransformPluginContext, TransformResult } from 'rollup'
import { mpxStyleTransform } from '@mpxjs/loaders/style-loader'
import { ResolvedOptions } from '../../options'
import { SFCDescriptor } from '../compiler'
import { proxyPluginContext } from '../../pluginContextProxy/index'
import mpx from '../mpx'

async function mpxTransformStyle(
  code: string,
  filename: string,
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<TransformResult> {
  return mpxStyleTransform(code, proxyPluginContext(pluginContext), {
    sourceMap: options.sourceMap,
    map: pluginContext.getCombinedSourcemap(),
    resource: filename,
    mpx: mpx
  })
}

/**
 * transfrom style
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
  index: number,
  pluginContext: TransformPluginContext
): Promise<TransformResult | undefined> {
  const mpxStyle = await mpxTransformStyle(
    code,
    filename,
    descriptor,
    options,
    pluginContext
  )
  return mpxStyle
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
