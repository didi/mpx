import hash from 'hash-sum'
import path from 'path'
import { ResolvedOptions } from '../index'

export default function pathHash(
  resourcePath: string,
  options?: ResolvedOptions
): string {
  let hashPath = resourcePath
  const pathHashMode = options?.pathHashMode
  const projectRoot = options?.projectRoot || ''
  if (pathHashMode === 'relative') {
    hashPath = path.relative(projectRoot, resourcePath)
  }
  if (typeof pathHashMode === 'function') {
    hashPath = pathHashMode(resourcePath, projectRoot) || resourcePath
  }
  return hash(hashPath)
}
