import { createFilter, Plugin } from 'vite'
import { parseRequest } from '@mpxjs/compile-utils'
import MagicString from 'magic-string'
import { resolvedConfig } from '../config'
import stringify from '../../utils/stringify'
import { getDescriptor } from '../utils/descriptorCache'

/**
 * 给外联的js加上global配置
 * @returns
 */
export function createMpxOutSideJsPlugin(): Plugin {
  const filter = createFilter([/\.(js|ts)$/])
  return {
    name: 'vite:mpx-outside-js',
    async transform(code, id) {
      const { resourcePath: filename } = parseRequest(id)
      if (!filter(filename)) return
      const descriptor = getDescriptor(filename)
      if (!descriptor) return
      const s = new MagicString(code)
      !resolvedConfig.isProduction &&
        s.prepend(`global.currentResource = ${stringify(filename)}\n`)
      s.prepend(`global.currentModuleId = ${stringify(descriptor.id)}\n`)
      return {
        code: s.toString(),
        map: s.generateMap({
          file: filename + '.map',
          source: filename
        })
      }
    }
  }
}
