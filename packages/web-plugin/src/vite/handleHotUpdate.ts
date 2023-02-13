import { addQuery } from '@mpxjs/compile-utils'
import { HmrContext } from 'vite'
import { getDescriptor, setPrevDescriptor } from './utils/descriptorCache'

export default async function handleHotUpdate(ctx: HmrContext) {
  const prevDescriptor = getDescriptor(ctx.file)
  if (!prevDescriptor) return
  // 有descriptor缓存的是mpx文件或者外联json文件
  setPrevDescriptor(ctx.file, prevDescriptor)

  // 改写read方法，vue内部热更新会调用
  ctx.read = async function () {
    // 增加type令mpx转换为一个默认的空的js并跳过vue插件转换
    const id = addQuery(ctx.file, {
      type: 'hot',
      vue: true,
      isPage: prevDescriptor?.isPage,
      app: prevDescriptor?.app,
      isComponent: prevDescriptor?.isComponent
    })
    // 插件转换mpx文件并缓存代码到vueSfc
    await ctx.server.transformRequest(id)
    const descriptor = getDescriptor(ctx.file)
    // 给vue热更新返回转换后的代码，让其对比
    return descriptor?.vueSfc || ''
  }

}
