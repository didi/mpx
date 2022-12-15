import addQuery from '@mpxjs/compile-utils/add-query'
import parseRequest from '@mpxjs/compile-utils/parse-request'
import { HmrContext } from 'vite'
import { getDescriptor, setPrevDescriptor } from './utils/descriptorCache'

export default async function handleHotUpdate(ctx: HmrContext) {
  const prevDescriptor = getDescriptor(ctx.file)
  if (prevDescriptor) {
    setPrevDescriptor(ctx.file, prevDescriptor)
  }
  ctx.read = async function () {
    const { resourcePath: filename } = parseRequest(ctx.file)
    const id = addQuery(filename, {
      type: 'main',
      vue: true,
      page: prevDescriptor?.isPage,
      app: prevDescriptor?.app,
      component: prevDescriptor?.isComponent
    })
    await ctx.server.transformRequest(id)
    const descriptor = getDescriptor(filename)
    return descriptor?.vueSfc || ''
  }
}
