import path from 'path'
import pathHash from './pageHash'
import { MpxOptions } from '../mpx'

export default function getOutputPath(
  resourcePath:string,
  type: string,
  options: MpxOptions,
  { ext = '', conflictPath = '' } = {}): string {
  const name = path.parse(resourcePath).name
  const hash = pathHash(resourcePath)
  const customOutputPath = options.customOutputPath
  if (conflictPath) return conflictPath.replace(/(\.[^\\/]+)?$/, match => hash + match)
  if (typeof customOutputPath === 'function') return customOutputPath(type, name, hash, ext).replace(/^\//, '')
  if (type === 'component' || type === 'page') return path.join(type + 's', name + hash, 'index' + ext)
  return path.join(type, name + hash + ext)
}
