import hash from 'hash-sum'
import path from 'path'
import { Options } from '../options'

export default function pathHash(
  resourcePath: string,
  options?: Options
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
