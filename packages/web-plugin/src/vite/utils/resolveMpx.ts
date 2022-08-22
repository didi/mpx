import path from 'path'

export function resolveMpxRuntime(runtimePath: string): string {
  return path.join('@mpxjs/webpack-plugin/lib/runtime', runtimePath)
}
