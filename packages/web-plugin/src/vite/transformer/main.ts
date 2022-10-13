import { TransformPluginContext, TransformResult } from 'rollup'
import { transformMain as vueTransformMain } from 'vite-plugin-vue2/dist/main.js'
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
    // transform to vue
    const { code: vueCode } = await vueTransformMain(
      genVueSfc(templateBlock, scriptBlock, stylesBlock),
      filename,
      options,
      pluginContext
    )
    // replace "*.mpx?vue" to "*.mpx?mpx"
    // this way mpx does not enter the logic of the VuePlugin
    // replace all \/\/\n for sourceMap
    return {
      code: vueCode
        .replace(/(\.mpx)(\?vue)/g, `$1?mpx`)
        .replace(/^(\/\/\n)*/, ''),
      map: map
    }
  }
}

function genVueSfc(...args: { output: string }[]) {
  return args.map((v) => v.output).join('\n')
}
