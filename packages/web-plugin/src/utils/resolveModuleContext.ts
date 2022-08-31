import path from 'path'

export default function resolveModuleContext(moduleId: string): string {
  return path.dirname(moduleId)
}
