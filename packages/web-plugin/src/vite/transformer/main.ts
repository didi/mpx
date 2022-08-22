import { TransformPluginContext, TransformResult } from 'rollup'
import { transformMain as vueTransformMain } from 'vite-plugin-vue2/dist/main'
import { genScriptBlock, transformScript } from './script'
import { genTemplateBlock, processTemplate } from './template'
import { genStylesBlock } from './style'
import { processJSON } from './json'
import { ResolvedOptions } from '../options'
import { createDescriptor } from '../utils/descriptorCache'
import { Query } from '../utils/parseRequest'

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
    // this way mpx does not enter the logic of the Vueplugin
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
