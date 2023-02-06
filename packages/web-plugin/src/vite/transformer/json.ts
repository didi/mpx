import { TransformPluginContext } from 'rollup'
import { Options } from 'src/options'
import { jsonCompiler } from '../../transfrom/json-compiler'
import resolveJson from '../../utils/resolve-json-content'
import { SFCDescriptor } from '../utils/descriptorCache'

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
  const { filename } = descriptor

  try {
    const { localPagesMap, localComponentsMap, tabBarMap, tabBarStr } =
      await jsonCompiler({
        jsonConfig,
        pluginContext,
        context: filename,
        options,
        mode: 'vite'
      })
    descriptor.localPagesMap = localPagesMap
    descriptor.localComponentsMap = localComponentsMap
    descriptor.tabBarMap = tabBarMap
    descriptor.tabBarStr = tabBarStr
  } catch (error) {
    pluginContext.error(`[mpx] process json error: ${error}`)
  }
}
