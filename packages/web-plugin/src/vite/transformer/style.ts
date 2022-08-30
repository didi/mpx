import { TransformPluginContext, TransformResult } from 'rollup'
import { createFilter } from 'vite'
import postcss from 'postcss'
import { transformStyle as vueTransformStyle } from 'vite-plugin-vue2/dist/style'
import genComponentTag from '@mpxjs/utils/gen-component-tag'
import trim from '@mpxjs/compiler/style-compiler/plugins/trim'
import rpx from '@mpxjs/compiler/style-compiler/plugins/rpx'
import vw from '@mpxjs/compiler/style-compiler/plugins/vw'
import pluginCondStrip from '@mpxjs/compiler/style-compiler/plugins/conditional-strip'
import scopeId from '@mpxjs/compiler/style-compiler/plugins/scope-id'
import { SFCDescriptor } from '../compiler'
import { ResolvedOptions } from '../../options'
import loadPostcssConfig from '../../utils/loadPostcssConfig'

async function mpxTransformStyle(
  code: string,
  filename: string,
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
) {
  const { autoScopeRules, defs, transRpxRules: transRpxRulesRaw } = options
  const filter = createFilter(autoScopeRules.include, autoScopeRules.exclude)
  const autoScope = autoScopeRules.include && filter(filename)
  const transRpxRules = transRpxRulesRaw
    ? Array.isArray(transRpxRulesRaw)
      ? transRpxRulesRaw
      : [transRpxRulesRaw]
    : []
  const inlineConfig = { ...options.postcssInlineConfig }
  const config = await loadPostcssConfig({ webpack: {}, defs }, inlineConfig)
  const plugins = config.plugins.concat(trim)

  if (autoScope) {
    const moduleId = descriptor.id
    plugins.push(scopeId({ id: moduleId }))
  }

  plugins.push(
    pluginCondStrip({
      defs
    })
  )

  for (const item of transRpxRules) {
    const { mode, comment, designWidth, include, exclude } = item || {}
    const filter = createFilter(include, exclude)
    if (filter(filename)) {
      plugins.push(rpx({ mode, comment, designWidth }))
    }
  }

  if (options.mode === 'web') {
    plugins.push(vw)
  }

  const result = await postcss(plugins).process(code, {
    to: filename,
    from: filename,
    map: options.sourceMap
      ? {
          inline: false,
          annotation: false
        }
      : false,
    ...config.options
  })

  if (result.messages) {
    result.messages.forEach(({ type, file }) => {
      if (type === 'dependency') {
        pluginContext.addWatchFile(file)
      }
    })
  }

  return {
    code: result.css,
    map: result.map && result.map.toJSON()
  }
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
  const vueStyle = await vueTransformStyle(
    mpxStyle.code,
    filename,
    descriptor,
    index,
    pluginContext
  )
  return vueStyle?.code
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
