import { createFilter, Plugin } from 'vite'
import { Options } from '../../options'
import { addQuery, parseRequest } from '@mpxjs/compile-utils'
import { ENTRY_HELPER_CODE, renderEntryCode, renderPageRouteCode } from '../helper'
import mpxGlobal from '../mpx'

/**
 * 推断mpx入口文件并记录的插件
 * @param options - Options
 * @returns
 */
export function createResolveEntryPlugin(options: Options): Plugin {
  const filter = createFilter([/\.mpx$/])
  return {
    name: 'vite:mpx-resolve-entry',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      const { queryObj: query, resourcePath: filename } = parseRequest(source)
      if (!filter(filename)) return
      if (
        query.resolve === undefined &&
        query.vue === undefined &&
        query.app === undefined &&
        query.isPage === undefined &&
        query.isComponent === undefined
      ) {
        // entry mpx
        const resolution = await this.resolve(source, importer, {
          skipSelf: true,
          ...options
        })
        if (resolution) {
          if (mpxGlobal.entry === undefined) {
            mpxGlobal.entry = resolution.id
          }
          if (mpxGlobal.entry === resolution.id) {
            return ENTRY_HELPER_CODE
          }
        }
      }
      if (query.resolve) {
        const resolution = await this.resolve(source, importer, {
          skipSelf: true,
          ...options
        })
        if(resolution){
          // 跳过vue-plugin
          return addQuery(resolution.id, {
            raw: true
          })
        }
      }
    },
    load(id) {
      if (id === ENTRY_HELPER_CODE && mpxGlobal.entry) {
        return renderEntryCode(mpxGlobal.entry, options)
      }
      const { resourcePath: filename, queryObj: query } = parseRequest(id)
      if (!filter(filename)) return
      if (query.resolve !== undefined) {
        // 强制改raw
        return renderPageRouteCode(options, filename)
      }
    }
  }
}
