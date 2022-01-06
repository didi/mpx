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
 * @returns <template>descriptor.template.content</template>
 */
export function genStylesBlock(descriptor: SFCDescriptor): { output: string } {
  const { styles } = descriptor
  return { output: styles.map(style => genComponentTag(style)).join('\n') }
}
