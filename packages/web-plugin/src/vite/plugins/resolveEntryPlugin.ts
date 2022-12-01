import { createFilter, Plugin } from 'vite'
import { ResolvedOptions } from '../../options'
import parseRequest from '@mpxjs/compile-utils/parse-request'
import { ENTRY_HELPER_CODE, renderEntryCode } from '../helper'
import mpxGlobal from '../mpx'

export function createResolveEntryPlugin(options: ResolvedOptions): Plugin {
  const filter = createFilter([/\.mpx$/])
  return {
    name: 'vite:mpx-resolve-entry',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!filter(source)) return
      const { queryObj: query } = parseRequest(source)
      if (
        mpxGlobal.entry === undefined &&
        query.resolve === undefined &&
        query.mpx === undefined &&
        query.app === undefined &&
        query.isPage === undefined &&
        query.isComponent === undefined
      ) {
        // entry mpx
        const resolution = await this.resolve(source, importer, {
          skipSelf: true,
          ...options
        })
        if (resolution) mpxGlobal.entry = resolution.id
        return ENTRY_HELPER_CODE
      }
    },
    load(id) {
      if (id === ENTRY_HELPER_CODE && mpxGlobal.entry)
        return renderEntryCode(mpxGlobal.entry, options)
    }
  }
}
