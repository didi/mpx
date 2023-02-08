import { TransformPluginContext, TransformResult } from 'rollup'
import { Options } from '../../options'
import { OptionObject } from 'loader-utils'
import { createDescriptor } from '../utils/descriptorCache'
import { processJSON } from './json'
import { genScriptBlock, transformScript } from './script'
import { genStylesBlock } from './style'
import { genTemplateBlock } from './template'

export async function transformMain(
  code: string,
  filename: string,
  query: OptionObject,
  options: Options,
  pluginContext: TransformPluginContext
): Promise<TransformResult | undefined> {
  const descriptor = createDescriptor(filename, code, query, options)
  if (descriptor) {
    // set pages/component to descriptor
    await processJSON(descriptor, options, pluginContext)
    // generate template block, delay transform template
    const templateBlock = await genTemplateBlock(
      descriptor,
      options,
      pluginContext
    )
    // transform script
    const { code, map } = await transformScript(descriptor, options)
    // generate script block
    const scriptBlock = await genScriptBlock(descriptor, code)
    // generate styles block, delay transform style
    const stylesBlock = await genStylesBlock(descriptor)
    const vueSfc = genVueSfc(templateBlock, scriptBlock, stylesBlock)
    if (query.type === 'hot') descriptor.vueSfc = vueSfc
    return {
      code: vueSfc,
      map: map
    }
  }
}

function genVueSfc(...args: { output: string }[]) {
  return args.map(v => v.output).join()
}
