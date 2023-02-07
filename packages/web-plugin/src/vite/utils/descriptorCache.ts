import { CompilerResult, templateCompiler } from '@mpxjs/compiler'
import path from 'path'
import slash from 'slash'
import { Options } from '../../options'
import { JsonTransfromResult } from '../../transfrom/json-compiler'
import { TemplateTransformResult } from '../../transfrom/template-helper'
import { OptionObject } from 'loader-utils'
import pathHash from '../../utils/pageHash'
import { resolvedConfig } from '../config'

const cache = new Map<string, SFCDescriptor>()
const prevCache = new Map<string, SFCDescriptor | undefined>()

export interface SFCDescriptor
  extends CompilerResult,
    Omit<TemplateTransformResult, 'templateContent'>,
    JsonTransfromResult {
  id: string
  filename: string
  app: boolean
  isPage: boolean
  isComponent: boolean
  vueSfc?: string
}

function genDescriptorTemplate() {
  const template: SFCDescriptor['template'] = {
    tag: 'template',
    type: 'template',
    content:
      '<div class="app"><mpx-keep-alive><router-view class="page"></router-view></mpx-keep-alive></div>',
    attrs: {},
    start: 0,
    end: 0
  }
  return template
}

function genDescriptorScript(descriptor: SFCDescriptor) {
  const script: SFCDescriptor['script'] = {
    tag: 'script',
    type: 'script',
    content: '',
    attrs: {},
    start: 0,
    end: 0
  }
  if (descriptor.app) {
    script.content = `
import { createApp } from "@mpxjs/core"
createApp({})`
  }
  if (descriptor.isPage) {
    script.content = `
import { createPage } from "@mpxjs/core"
createPage({})`
  }
  if (descriptor.isComponent) {
    script.content = `
import { createComponent } from "@mpxjs/core"
createComponent({})`
  }
  return script
}

export function createDescriptor(
  filename: string,
  code: string,
  query: OptionObject,
  options: Options
): SFCDescriptor {
  const { projectRoot = '', mode = 'web', defs, env } = options
  const { isProduction, sourceMap } = resolvedConfig
  const normalizedPath = slash(
    path.normalize(path.relative(projectRoot, filename))
  )
  const isPage = query.isPage !== undefined
  const isComponent = query.isComponent !== undefined
  const compilerResult = templateCompiler.parseComponent(code, {
    mode,
    defs,
    env,
    filePath: filename,
    pad: 'line',
    needMap: sourceMap
  })
  if (compilerResult.script && compilerResult.script.map) {
    const sources = compilerResult.script.map.sources || []
    compilerResult.script.map.sources = sources.map(
      (v: string) => v.split('?')[0]
    )
  }
  const descriptor: SFCDescriptor = {
    ...compilerResult,
    id: pathHash(normalizedPath + (isProduction ? code : '')),
    filename,
    isPage,
    isComponent,
    app: !(isPage || isComponent),
    wxsModuleMap: {},
    wxsContentMap: {},
    builtInComponentsMap: {},
    genericsInfo: undefined,
    jsonConfig: {},
    localPagesMap: {},
    localComponentsMap: {},
    tabBarMap: {}
  }
  if (descriptor.app) {
    descriptor.template = genDescriptorTemplate()
  }
  if (!descriptor.script) {
    descriptor.script = genDescriptorScript(descriptor)
  }
  cache.set(filename, descriptor)
  return descriptor
}

export function getPrevDescriptor(filename: string): SFCDescriptor | undefined {
  return prevCache.get(filename)
}

export function setPrevDescriptor(
  filename: string,
  entry: SFCDescriptor
): void {
  prevCache.set(filename, entry)
}

export function getDescriptor(
  filename: string,
  code?: string,
  query?: OptionObject,
  options?: Options,
  createIfNotFound = true
): SFCDescriptor | undefined {
  if (cache.has(filename)) {
    return cache.get(filename)
  }
  if (createIfNotFound && code && query && options) {
    return createDescriptor(filename, code, query, options)
  }
}

export function setDescriptor(filename: string, entry: SFCDescriptor): void {
  cache.set(filename, entry)
}
