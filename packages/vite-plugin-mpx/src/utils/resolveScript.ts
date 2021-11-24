import { TransformPluginContext } from 'rollup'
import fs from 'fs'
import { ResolvedOptions } from '../index'
import { SFCDescriptor } from '../compiler'

export default async function resolveScriptFile(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<string> {
  const { script } = descriptor
  let content = script?.content || ''
  if (script?.src) {
    const resolveId = await pluginContext.resolve(script.src, descriptor.filename)
    if (resolveId) {
      pluginContext.addWatchFile(resolveId.id)
      content = fs.readFileSync(resolveId.id, 'utf-8')
    }
  }
  return content
}
