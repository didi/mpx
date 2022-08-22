import { HmrContext, ModuleNode } from 'vite'
import _debug from 'debug'
import { SFCBlock } from './compiler'
import { ResolvedOptions } from './options'
import {
  getDescriptor,
  setPrevDescriptor,
  createDescriptor
} from './utils/descriptorCache'
import { processTemplate } from './transformer/template'

const debug = _debug('vite:hmr')

/**
 * forked from vite-plugin-vue2
 * change
 * 1. update script when template buildInComponent change
 * 2. remove custom block
 * 3. remove cssVar
 * 4. remove scriptSetup
 */
export default async function handleHotUpdate(
  { modules, file, read, server }: HmrContext,
  options: ResolvedOptions
): Promise<ModuleNode[] | undefined> {
  const prevDescriptor = getDescriptor(file)
  if (!prevDescriptor) {
    return // file hasn't been requested yet (e.g. async component)
  }
  setPrevDescriptor(file, prevDescriptor)
  const content = await read()
  const descriptor = createDescriptor(
    file,
    content,
    // mock query
    {
      page: prevDescriptor.page ? null : undefined,
      component: prevDescriptor.component ? null : undefined
    },
    options
  )

  const updateType = []
  const affectedModules = new Set<ModuleNode | undefined>()

  const mainModule = modules.find(
    (m) => !/type=/.test(m.url) || /type=script/.test(m.url)
  )
  const templateModule = modules.find((m) => /type=template/.test(m.url))

  if (
    !isEqualBlock(descriptor.json, prevDescriptor.json) ||
    descriptor.json?.src !== prevDescriptor.json?.src
  ) {
    server.ws.send({
      type: 'full-reload',
      path: '*'
    })
    return []
  } else {
    // reused jsonConfig and processJson's data
    descriptor.jsonConfig = prevDescriptor.jsonConfig
    descriptor.pagesMap = prevDescriptor.pagesMap
    descriptor.componentsMap = prevDescriptor.componentsMap
    descriptor.tabBarMap = prevDescriptor.tabBarMap
    descriptor.tabBarStr = prevDescriptor.tabBarStr
  }

  if (!isEqualBlock(descriptor.script, prevDescriptor.script)) {
    affectedModules.add(mainModule)
    updateType.push('script')
  }

  let needRerender = false
  if (!isEqualBlock(descriptor.template, prevDescriptor.template)) {
    needRerender = true
    affectedModules.add(templateModule)
    processTemplate(descriptor, options) // recollect
    if (
      !isEqualObject(
        descriptor.builtInComponentsMap,
        prevDescriptor.builtInComponentsMap
      )
    ) {
      affectedModules.add(mainModule)
    }
  } else {
    descriptor.builtInComponentsMap = prevDescriptor.builtInComponentsMap
    descriptor.genericsInfo = prevDescriptor.genericsInfo
  }

  let didUpdateStyle = false
  const prevStyles = prevDescriptor.styles || []
  const nextStyles = descriptor.styles || []

  // force reload if scoped status has changed
  if (
    prevStyles.some((s) => s.attrs.scoped) !==
    nextStyles.some((s) => s.attrs.scoped)
  ) {
    // template needs to be invalidated as well
    affectedModules.add(templateModule)
    affectedModules.add(mainModule)
  }

  // only need to update styles if not reloading, since reload forces
  // style updates as well.
  for (let i = 0; i < nextStyles.length; i++) {
    const prev = prevStyles[i]
    const next = nextStyles[i]
    if (!prev || !isEqualBlock(prev, next)) {
      didUpdateStyle = true
      const mod = modules.find(
        (m) =>
          m.url.includes(`type=style&index=${i}`) &&
          m.url.endsWith(`.${next.attrs.lang || 'css'}`)
      )
      if (mod) {
        affectedModules.add(mod)
        if (mod.url.includes('&inline')) {
          affectedModules.add(mainModule)
        }
      } else {
        // new style block - force reload
        affectedModules.add(mainModule)
      }
    }
  }

  if (prevStyles.length > nextStyles.length) {
    // style block removed - force reload
    affectedModules.add(mainModule)
  }

  if (needRerender) {
    updateType.push(`template`)
  }

  if (didUpdateStyle) {
    // update descriptor styles vue content
    updateType.push(`style`)
  }

  if (updateType.length) {
    debug(`[mpx:update(${updateType.join('&')})] ${file}`)
  }

  return [...affectedModules].filter(Boolean) as ModuleNode[]
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
  return keysA.every((key) => b[key])
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
  return keysA.every((key) => a.attrs[key] === b.attrs[key])
}
