import path from 'path'

export function resolveModuleContext (moduleId: string): string {
  return path.dirname(moduleId)
}
