import { TransformPluginContext } from 'rollup'
import { TransformResult } from 'vite'
import processTemplate, { ProcessTemplateResult } from './web/processTemplate'
import processJSON, { ProcessJsonResult } from './web/processJSON'
import processStyles from './web/processStyles'
import processScript from './web/processScript'
import { ResolvedOptions } from '../index'
import { SFCDescriptor } from '../compiler'
import { createDescriptor } from '../utils/descriptorCache'
import resolveJson from '../utils/resolveJson'
import { Query } from '../utils/parseRequest'

export default async function transformMpx(
  code: string,
  filename: string,
  query: Query,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<TransformResult | undefined> {
  const descriptor = createDescriptor(filename, code, query, options)
  // console.log('descriptor', descriptor)
  if (descriptor) {
    const jsonConfig = await resolveJson(descriptor, options, pluginContext)
    descriptor.jsonConfig = jsonConfig
    const templateResult = await genTemplateCode(
      descriptor,
      options,
      pluginContext
    )
    descriptor.builtInComponentsMap = templateResult.builtInComponentsMap
    // console.log('templateResult', templateResult)
    const styleResult = await genStylesCode(descriptor)
    // console.log('styleResult', styleResult)
    const jsonResult = await genJsonCode(descriptor, options, pluginContext)
    // console.log('jsonResult', jsonResult)
    const scriptResult = await genScriptCode(
      descriptor,
      options,
      pluginContext,
      templateResult,
      jsonResult
    )
    // console.log('scriptResult', scriptResult)
    const result = [
      templateResult.output,
      styleResult.output,
      scriptResult.output
    ].join('\n')

    descriptor.vue = result

    return {
      code: result,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map: (descriptor.script?.map) as any || {
        mappings: ''
      }
    }
  }
}

async function genTemplateCode(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
) {
  return await processTemplate(descriptor, options, pluginContext)
}

async function genStylesCode(descriptor: SFCDescriptor) {
  return await processStyles(descriptor)
}

async function genScriptCode(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext,
  templateResult: ProcessTemplateResult,
  jsonResult: ProcessJsonResult
) {
  return await processScript(
    descriptor,
    options,
    pluginContext,
    templateResult,
    jsonResult
  )
}

async function genJsonCode(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
) {
  const jsonRes = await processJSON(descriptor, options, pluginContext)
  return jsonRes
}
