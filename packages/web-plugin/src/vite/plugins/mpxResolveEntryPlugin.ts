import { Plugin, createFilter } from 'vite'
import mpxGlobal from '../mpx'
import parseRequest from '../utils/parseRequest'

export default function resolveEntryPlugin(): Plugin {
  const filter = createFilter([/\.mpx/])
  return {
    name: 'vite:mpx-resolve-entry',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!filter(source)) return
      const { query } = parseRequest(source)
      if (
        query.resolve === undefined &&
        query.mpx === undefined &&
        query.app === undefined &&
        query.page === undefined &&
        query.component === undefined
      ) {
        // entry mpx
        const resolution = await this.resolve(source, importer, {
          skipSelf: true,
          ...options
        })
        if (resolution) return (mpxGlobal.entry = resolution.id)
      }
    }
  }
}
