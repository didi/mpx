import genComponentTag from '@mpxjs/compile-utils/gen-component-tag'
import { TransformPluginContext } from 'rollup'
import { TransformResult } from 'vite'
import { compileSFCTemplate as vueTransformTemplate } from 'vite-plugin-vue2/dist/template.js'
import { ResolvedOptions } from '../../options'
import { SFCDescriptor } from '../../types/compiler'
import templateTransform from '../../transfrom/template-helper'

const templateTransformCache: Record<string, string> = {}

/**
 * transform mpx template to vue template
 * @param code - mpx template code
 * @param filename - filename
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
export async function transformTemplate(
  code: string,
  filename: string,
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<TransformResult | undefined> {
  if (descriptor.template) {
    return await vueTransformTemplate(
      templateTransformCache[filename], // use processTemplate transform cache
      descriptor.template,
      filename,
      options,
      pluginContext
    )
  }
}

// const mpxKeepAlivePath = normalize.runtime('components/web/mpx-keep-alive.vue')
/**
 * collect template buildInComponent
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
export function processTemplate(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext?: TransformPluginContext
): void {
  const { id, filename, jsonConfig, app, template } = descriptor
  let builtInComponentsMap: SFCDescriptor['builtInComponentsMap'] = {}
  let genericsInfo: SFCDescriptor['genericsInfo']
  let wxsContentMap: SFCDescriptor['wxsContentMap'] = {}
  let wxsModuleMap: SFCDescriptor['wxsModuleMap'] = {}

  if (template) {
    const result = templateTransform({ template,
      mpx: options,
      pluginContext,
      jsonConfig,
      app,
      resource: filename,
      moduleId: id
    })
    wxsModuleMap = result.wxsModuleMap
    wxsContentMap = result.wxsContentMap
    genericsInfo = result.genericsInfo
    builtInComponentsMap = result.builtInComponentsMap
    templateTransformCache[filename] = result.content
  }

  descriptor.wxsModuleMap = wxsModuleMap
  descriptor.wxsContentMap = wxsContentMap
  descriptor.genericsInfo = genericsInfo
  descriptor.builtInComponentsMap = builtInComponentsMap
}

/**
 * gen template block
 * @param descriptor - SFCDescriptor
 * @returns <template>descriptor.template.content</template>
 */
export function genTemplateBlock(descriptor: SFCDescriptor): {
  output: string
} {
  return {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    output: genComponentTag(descriptor.template!)
  }
}
