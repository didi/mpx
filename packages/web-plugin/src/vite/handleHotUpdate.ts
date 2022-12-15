import addQuery from '@mpxjs/compile-utils/add-query'
import parseRequest from '@mpxjs/compile-utils/parse-request'
import { HmrContext } from 'vite'
import { SFCBlock } from './compiler'
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

export function isEqualObject(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) {
    return false
  }
  return keysA.every(key => b[key] === a[key])
}

export function isEqualBlock(a: SFCBlock | null, b: SFCBlock | null): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  // src imports will trigger their own updates
  if (a.src && b.src && a.src === b.src) return true
  if (a.content !== b.content) return false
  const keysA = Object.keys(a.attrs)
  const keysB = Object.keys(b.attrs)
  if (keysA.length !== keysB.length) {
    return false
  }
  return keysA.every(key => a.attrs[key] === b.attrs[key])
}
