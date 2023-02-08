import { addQuery } from '@mpxjs/compile-utils'
import { HmrContext } from 'vite'
import {
  getDescriptor,
  setPrevDescriptor,
  createDescriptor,
  SFCDescriptor
} from './utils/descriptorCache'
import { APP_HELPER_CODE, TAB_BAR_PAGE_HELPER_CODE } from './helper'
import { OptionObject } from 'loader-utils'
import { Options } from '../options'
import { SFCBlock } from '@mpxjs/compiler'

function invalidateModuleById(ctx: HmrContext, id: string) {
  const module = ctx.server.moduleGraph.getModuleById(id)
  if (module) {
    ctx.server.reloadModule(module)
  }
}

export default async function handleHotUpdate(
  ctx: HmrContext,
  options: Options
) {
  const prevDescriptor = getDescriptor(ctx.file)
  if (!prevDescriptor) return
  // 有descriptor缓存的是mpx文件或者外联json文件
  setPrevDescriptor(ctx.file, prevDescriptor)
  const isJsonFile = ctx.file.endsWith('.json')
  const descriptor = isJsonFile
    ? getDescriptor(ctx.file)
    : createDescriptor(
        ctx.file,
        await ctx.read(),
        {
          // 通常文件的类型不会改变
          isPage: prevDescriptor?.isPage,
          isComponent: prevDescriptor?.isComponent
        } as OptionObject,
        options
      )
  if (!descriptor) return
  function updateVirtualModule() {
    if (descriptor?.app) {
      // app json 更新需要额外更新虚拟模块
      invalidateModuleById(ctx, APP_HELPER_CODE)
      invalidateModuleById(ctx, TAB_BAR_PAGE_HELPER_CODE)
    }
    invalidateModuleById(
      ctx,
      // 所有的mpx的script变动或者json变动都需要额外更新globalDefine模块
      // 以刷新当前的moduleId来获取正确的options
      // 如果是外联json，需要转换到mpx文件更新
      addQuery(isJsonFile ? descriptor?.filename : ctx.file, {
        vue: true,
        type: 'globalDefine'
      })
    )
  }
  if (
    hasScriptChanged(prevDescriptor, descriptor) ||
    hasInlineJsonChanged(prevDescriptor, descriptor)
  ) {
    updateVirtualModule()
  }

  if (isJsonFile) {
    if (hasJsonChanged(prevDescriptor.json?.content, await ctx.read())) {
      updateVirtualModule()
    } else {
      return []
    }
  }

  ctx.read = async function () {
    const id = addQuery(ctx.file, {
      type: 'hot',
      vue: true,
      isPage: prevDescriptor?.isPage,
      app: prevDescriptor?.app,
      isComponent: prevDescriptor?.isComponent
    })
    await ctx.server.transformRequest(id)
    const descriptor = getDescriptor(ctx.file)
    return descriptor?.vueSfc || ''
  }
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

function hasScriptChanged(prev: SFCDescriptor, next: SFCDescriptor): boolean {
  if (!isEqualBlock(prev.script, next.script)) {
    return true
  }
  return false
}

function hasInlineJsonChanged(
  prev: SFCDescriptor,
  next: SFCDescriptor
): boolean {
  if (!isEqualBlock(prev.json, next.json)) {
    return true
  }
  return false
}

function hasJsonChanged(prev?: string, next?: string): boolean {
  return prev !== next
}
