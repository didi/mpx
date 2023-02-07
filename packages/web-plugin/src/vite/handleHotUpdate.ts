import { parseRequest, addQuery } from '@mpxjs/compile-utils'
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
      type: 'hot',
      vue: true,
      isPage: prevDescriptor?.isPage,
      app: prevDescriptor?.app,
      isComponent: prevDescriptor?.isComponent
    })
    await ctx.server.transformRequest(id)
    const descriptor = getDescriptor(filename)
    return descriptor?.vueSfc || ''
  }
}
