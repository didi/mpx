import { TransformPluginContext } from 'rollup'
import fs from 'fs'
import json5 from 'json5'
import mpxJSON from '@mpxjs/webpack-plugin/lib/utils/mpx-json'
import path from 'path'
import { normalizePath } from '@rollup/pluginutils'
import { ResolvedOptions } from '../options'
import { SFCDescriptor } from '../compiler'
import mpxGlobal from '../mpx'
import parseRequest from '../utils/parseRequest'
import pathHash from '../utils/pageHash'
import resolveModuleContext from '../utils/resolveModuleContext'
import addQuery from '../utils/addQuery'
import { createDescriptor } from '../utils/descriptorCache'
import stringify from '../utils/stringify'

/**
 * wechat miniprogram app/page/component config type
 */
export interface JsonConfig {
  component?: boolean
  usingComponents?: Record<string, string>
  componentGenerics?: Record<string, { default?: string }>
  packages?: string[]
  pages?: (
    | string
    | {
        src: string
        path: string
      }
  )[]
  tabBar?: {
    custom?: boolean
    color?: string
    selectedColor?: string
    backgroundColor?: string
    list?: {
      pagePath: string
      text: string
    }[]
  }
  networkTimeout?: {
    request: number
    connectSocket: number
    uploadFile: number
    downloadFile: number
  }
  subPackages: {
    root?: 'string'
    pages: JsonConfig['pages']
  }[]
  window?: Record<string, unknown>
  style?: string
  singlePage?: {
    navigationBarFit: boolean
  }
}

/**
 * resolve json content
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 * @returns json config
 */
export async function resolveJson(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<JsonConfig> {
  const { defs } = options
  const { json } = descriptor
  let content = json?.content || '{}'
  if (json?.src) {
    const resolution = await pluginContext.resolve(
      json.src,
      descriptor.filename
    )
    if (resolution) {
      pluginContext.addWatchFile(resolution.id)
      content = await fs.promises.readFile(resolution.id, 'utf-8')
      if (resolution.id.endsWith('.json.js')) {
        content = mpxJSON.compileMPXJSONText({
          source: content,
          defs,
          filePath: resolution.id
        })
      }
    }
  }
  return json5.parse(content)
}

/**
 * dep entry/packages/sub-packages to collect pages/components/tabbar
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
export async function processJSON(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<void> {
  const jsonConfig = (descriptor.jsonConfig = await resolveJson(
    descriptor,
    options,
    pluginContext
  ))
  const { filename } = descriptor
  const pagesMap: SFCDescriptor['pagesMap'] = {}
  const componentsMap: SFCDescriptor['componentsMap'] = {}

  let tabBarMap: Record<string, unknown> = {}
  let tabBarStr = ''

  const defaultTabbar = {
    borderStyle: 'black',
    position: 'bottom',
    custom: false,
    isShow: true
  }

  function emitWarning(msg: string) {
    pluginContext.warn(new Error('[json processor][' + filename + ']: ' + msg))
  }

  /**
   * ./page/index/index.mpx = page/index/index
   * @param page - pagePath
   */
  function genPageRoute(page: string, context: string, root = '') {
    const relative = path.relative(context, page)
    return normalizePath(
      path.join(root, /^(.*?)(\.[^.]*)?$/.exec(relative)?.[1] || '')
    )
  }

  const processTabBar = async (tabBar: JsonConfig['tabBar']) => {
    if (tabBar) {
      tabBar = { ...defaultTabbar, ...tabBar }
      tabBarMap = {}
      jsonConfig?.tabBar?.list?.forEach(({ pagePath }) => {
        tabBarMap[pagePath] = true
      })
      tabBarStr = stringify(tabBar)
      tabBarStr = tabBarStr.replace(
        /"(iconPath|selectedIconPath)":"([^"]+)"/g,
        function (matched) {
          return matched
        }
      )
    }
  }

  const processPages = async (
    pages: JsonConfig['pages'] = [],
    importer: string,
    root?: string
  ) => {
    const context = resolveModuleContext(importer)
    for (const page of pages) {
      const customPage = !(typeof page === 'string')
      const pageSrc = !customPage ? page : page.src
      const pageModule = await pluginContext.resolve(
        addQuery(pageSrc, { page: null }),
        importer
      )
      if (pageModule) {
        const pageId = pageModule.id
        const { filename: pageFileName } = parseRequest(pageModule.id)
        const pageRoute = !customPage
          ? genPageRoute(pageFileName, context, root)
          : page.path
        if (pagesMap[pageRoute]) {
          emitWarning(
            `Current page [${pageSrc}] which is imported from [${importer}] has been registered in pagesMap already, it will be ignored, please check it and remove the redundant page declaration!`
          )
          return
        }
        // record page route for resolve
        mpxGlobal.pagesMap[pageFileName] = pageRoute
        mpxGlobal.pagesEntryMap[pageFileName] = importer
        // resolved page
        pagesMap[pageRoute] = pageId
      } else {
        emitWarning(
          `Current page [${pageSrc}] is not in current pages directory [${context}]`
        )
      }
    }
  }

  const processComponent = async (
    componentName: string,
    componentPath: string,
    importer: string
  ) => {
    if (componentPath) {
      const componetModule = await pluginContext.resolve(
        addQuery(componentPath, { component: null }),
        importer
      )
      if (componetModule) {
        const componentId = componetModule.id
        const { filename: componentFileName } = parseRequest(componentId)
        mpxGlobal.componentsMap[componentFileName] =
          componentFileName + pathHash(componentFileName)
        componentsMap[componentName] = componentId
      }
    }
  }

  const processComponents = async (
    components: JsonConfig['usingComponents'],
    importer: string
  ) => {
    for (const key in components) {
      await processComponent(key, components[key], importer)
    }
  }

  const processGenerics = async (
    generics: JsonConfig['componentGenerics'] = {},
    importer: string
  ) => {
    for (const key in generics) {
      const generic = generics[key]
      if (generic.default) {
        await processComponent(`${key}default`, generic.default, importer)
      }
    }
  }

  const processPackages = async (
    packages: JsonConfig['packages'] = [],
    context: string
  ) => {
    for (const packagePath of packages) {
      const { filename, query } = parseRequest(packagePath)
      const packageModule = await pluginContext.resolve(filename, context)
      if (packageModule) {
        const packageId = packageModule.id
        pluginContext.addWatchFile(packageId)
        const code = await fs.promises.readFile(packageId, 'utf-8')
        const descriptor = createDescriptor(packageId, code, query, options)
        const { pages, packages } = (descriptor.jsonConfig = await resolveJson(
          descriptor,
          options,
          pluginContext
        ))
        await processPages(pages, packageId, query.root)
        await processPackages(packages, packageId)
      }
    }
  }

  const processSubPackages = async (
    subPackages: JsonConfig['subPackages'] = [],
    context: string
  ) => {
    for (const subPackage of subPackages) {
      await processPages(subPackage.pages, context, subPackage.root)
    }
  }

  try {
    await processPages(jsonConfig.pages, filename)
    await processPackages(jsonConfig.packages, filename)
    await processSubPackages(jsonConfig.subPackages, filename)
    await processComponents(jsonConfig.usingComponents, filename)
    await processGenerics(jsonConfig.componentGenerics, filename)
    await processTabBar(jsonConfig.tabBar)

    descriptor.pagesMap = pagesMap
    descriptor.componentsMap = componentsMap
    descriptor.tabBarMap = tabBarMap
    descriptor.tabBarStr = tabBarStr
  } catch (error) {
    pluginContext.error(`[mpx loader] process json error: ${error}`)
  }
}
