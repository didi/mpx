import { createFilter, Plugin, transformWithEsbuild } from 'vite'
import { parseRequest } from '@mpxjs/compile-utils'

/**
 * wxs文件支持
 * @returns 
 */
export function createWxsPlugin(): Plugin {
  const filter = createFilter([/\.wxs$/])
  return {
    name: 'vite:mpx-wxs',
    async transform(code, id) {
      const { resourcePath: filename } = parseRequest(id)
      if (!filter(filename)) return
      return await transformWithEsbuild(code, '', {
        format: 'esm',
        sourcefile: filename
      })
    }
  }
}
