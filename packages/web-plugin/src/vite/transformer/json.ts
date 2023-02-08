import { TransformPluginContext } from 'rollup'
import { Options } from '../../options'
import { jsonCompiler } from '../../transfrom/json-compiler'
import resolveJson from '../../utils/resolve-json-content'
import { setDescriptor, SFCDescriptor } from '../utils/descriptorCache'
import mpx from '../mpx'

export async function processJSON(
  descriptor: SFCDescriptor,
  options: Options,
  pluginContext: TransformPluginContext
): Promise<void> {
  const jsonConfig = (descriptor.jsonConfig = await resolveJson(
    descriptor,
    descriptor.filename,
    pluginContext,
    options
  ))
  // 记录jsonConfig的路径对应的descriptor
  setDescriptor(jsonConfig.path, descriptor)
  try {
    const jsonResult = await jsonCompiler({
      jsonConfig,
      pluginContext,
      context: jsonConfig.path || descriptor.filename,
      options,
      mode: 'vite',
      mpx
    })
    descriptor.localPagesMap = jsonResult.localPagesMap
    descriptor.localComponentsMap = jsonResult.localComponentsMap
    descriptor.tabBarMap = jsonResult.tabBarMap
  } catch (error) {
    pluginContext.error(`[mpx] process json error: ${error}`)
  }
}
