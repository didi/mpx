import { genComponentTag } from '@mpxjs/compile-utils'
import { TransformPluginContext } from 'rollup'
import { TransformResult } from 'vite'
import { Options } from '../../options'
import { SFCDescriptor } from '../utils/descriptor-cache'
import { templateProcess } from '../../processor/template-process'

/**
 * transform mpx template to vue template
 * @param code - mpx template code
 * @param filename - filename
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */

export async function transformTemplate(
  descriptor: SFCDescriptor,
  options: Options,
  pluginContext?: TransformPluginContext
): Promise<TransformResult | undefined> {
  const { id, filename, jsonConfig, app, template } = descriptor
  let builtInComponentsMap: SFCDescriptor['builtInComponentsMap'] = {}
  let genericsInfo: SFCDescriptor['genericsInfo']
  let wxsContentMap: SFCDescriptor['wxsContentMap'] = {}
  let wxsModuleMap: SFCDescriptor['wxsModuleMap'] = {}
  let templateContent = ''
  if (template) {
    ({
      wxsModuleMap,
      wxsContentMap,
      genericsInfo,
      builtInComponentsMap,
      templateContent
    } = templateProcess({
      template,
      options,
      pluginContext,
      jsonConfig,
      app,
      resource: filename,
      moduleId: id
    }))
  }
  descriptor.wxsModuleMap = wxsModuleMap
  descriptor.wxsContentMap = wxsContentMap
  descriptor.genericsInfo = genericsInfo
  descriptor.builtInComponentsMap = builtInComponentsMap

  return {
    code: templateContent,
    map: null
  }
}

/**
 * gen template block
 * @param descriptor - SFCDescriptor
 * @returns <template>descriptor.template.content</template>
 */
export async function genTemplateBlock(
  descriptor: SFCDescriptor,
  options: Options,
  pluginContext?: TransformPluginContext
): Promise<{
  output: string
}> {
  const templateContent = await transformTemplate(
    descriptor,
    options,
    pluginContext
  )
  return {
    output: genComponentTag({
      content: templateContent?.code || '',
      tag: 'template',
      attrs: descriptor.template?.attrs
    })
  }
}
