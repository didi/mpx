import { TransformPluginContext, TransformResult } from 'rollup'
import genComponentTag from '@mpxjs/webpack-plugin/lib/utils/gen-component-tag'
import { transformStyle as vueTransformStyle } from 'vite-plugin-vue2/dist/style'
import { SFCDescriptor } from '../compiler'

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
  index: number,
  pluginContext: TransformPluginContext
): Promise<TransformResult | undefined> {
  // TODO transform rpx
  // Pass style directly to vue
  return await vueTransformStyle(
    code,
    filename,
    descriptor,
    index,
    pluginContext
  )
}

/**
 * generate style block
 * @param descriptor - SFCDescriptor
 */
export function genStylesBlock(descriptor: SFCDescriptor): { output: string } {
  const output = []
  const { styles } = descriptor
  if (styles && styles.length) {
    styles.forEach((style) => {
      output.push(
        genComponentTag(style, {
          content(style) {
            return style.content
          }
        })
      )
    })
    output.push('\n')
  }
  return { output: output.join('\n') }
}
