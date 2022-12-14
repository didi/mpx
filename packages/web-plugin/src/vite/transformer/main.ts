import { TransformPluginContext, TransformResult } from 'rollup'
import { ResolvedOptions } from '../../options'
import { Query } from '../../types/query'
import { createDescriptor } from '../utils/descriptorCache'
import { processJSON } from './json'
import { genScriptBlock, transformScript } from './script'
import { genStylesBlock } from './style'
import { genTemplateBlock, processTemplate } from './template'

export async function transformMain(
  code: string,
  filename: string,
  query: Query,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<TransformResult | undefined> {
  const descriptor = createDescriptor(filename, code, query, options)
  if (descriptor) {
    // set pages/component to descriptor
    await processJSON(descriptor, options, pluginContext)
    // set builtInComponent/genericsInfo to descriptor
    processTemplate(descriptor, options, pluginContext)
    // generate template block, delay transform template
    const templateBlock = genTemplateBlock(descriptor)
    // transform script
    const { code, map } = await transformScript(
      descriptor,
      options,
      pluginContext
    )
    // generate script block
    const scriptBlock = await genScriptBlock(descriptor, code)
    // generate styles block, delay transform style
    const stylesBlock = genStylesBlock(descriptor)
    const vueSfc = genVueSfc(templateBlock, scriptBlock, stylesBlock)
    if (query.type === 'main') descriptor.vueSfc = vueSfc
    return {
      code: vueSfc,
      map: map
    }
  }
}

function genVueSfc(...args: { output: string }[]) {
  return args.map(v => v.output).join('\n')
}
