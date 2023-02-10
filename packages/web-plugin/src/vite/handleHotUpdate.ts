import { addQuery } from '@mpxjs/compile-utils'
import { HmrContext, ModuleNode } from 'vite'
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
import { vuePlugin } from './index'

export default async function handleHotUpdate(
  ctx: HmrContext,
  options: Options
) {
  const prevDescriptor = getDescriptor(ctx.file)
  if (!prevDescriptor) return
  // 有descriptor缓存的是mpx文件或者外联json文件
  setPrevDescriptor(ctx.file, prevDescriptor)
  const affectModules = new Set<ModuleNode>()
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

  function addAffectModuleById(id: string) {
    const module = ctx.server.moduleGraph.getModuleById(id)
    if (module) {
      affectModules.add(module)
    }
  }

  /**
   * 内联json或者js的更新，会导致createApp|createComponent|createPage重新运行
   * 为了保证内部运行时moduleId的获取正确，需要热更新globalDefine模块
   */
  if (
    hasScriptChanged(prevDescriptor, descriptor) ||
    hasInlineJsonChanged(prevDescriptor, descriptor)
  ) {
    const globalDefineModule = ctx.modules.find(v => /globalDefine/.test(v.id || ''))
    globalDefineModule && affectModules.add(globalDefineModule)
    if (descriptor?.app) {
      // app 更新需要额外更新虚拟模块
      addAffectModuleById(APP_HELPER_CODE)
      addAffectModuleById(TAB_BAR_PAGE_HELPER_CODE)
    }
  }

  /**
   * 如果是外联json文件，则手动获取globalDefine进行更新
   */
  if (isJsonFile && hasJsonChanged(prevDescriptor.json?.content, await ctx.read())) {
    addAffectModuleById(
      addQuery(descriptor?.filename, {
        vue: true,
        type: 'globalDefine'
      })
    )
    if (descriptor?.app) {
      // app 更新需要额外更新虚拟模块
      addAffectModuleById(APP_HELPER_CODE)
      addAffectModuleById(TAB_BAR_PAGE_HELPER_CODE)
    }
  }

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

  // 手动调用vue的热更新，因为无法添加globalDefine等其它虚拟模块
  // vue热更新会判断js,css,template模块，所以无需关注这几个模块的更新
  const vueAffectModules =
    //@ts-ignore
    ((await vuePlugin.handleHotUpdate?.(ctx)) as ModuleNode[]) || []
  vueAffectModules.forEach(v => affectModules.add(v))
  return [...affectModules].filter(Boolean)
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
