import { Plugin } from 'vite'
import { createFilter } from '@rollup/pluginutils'
import parseRequest from '../utils/parseRequest'
import addQuery from '../utils/addQuery'

export default function mpxResolverPlugin(): Plugin {
  const filter = createFilter([/\.mpx/])
  return {
    name: 'vite:mpx-resolver',
    enforce: 'pre',
    resolveId(id) {
      const { filename, query } = parseRequest(id)
      if (!filter(filename)) return
      console.log(111111, id, query)
      if (query.vue !== undefined) {
        const newQuery = { mpx: true, ...query }
        delete newQuery['vue']
        console.log(addQuery(filename, newQuery))
        return addQuery(filename, newQuery)
      }
    }
  }
}
