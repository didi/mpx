import path from 'path'

export function resolveMpxRuntime(runtimePath: string): string {
  return path.resolve(__dirname, '../../runtime', runtimePath)
}