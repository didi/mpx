import fs from 'fs'
import json5, { parse } from 'json5'
import path, { dirname, extname, join } from 'path'
import { TransformPluginContext } from 'rollup'
import { normalizePath } from 'vite'
import { ResolvedOptions } from '../../options'
import { proxyPluginContext } from '../../pluginContextProxy'
import addQuery from '@mpxjs/compile-utils/add-query'
import getJSONContent from '../../utils/get-json-content'
import parseRequest from '@mpxjs/compile-utils/parse-request'
import resolveModuleContext from '../../utils/resolveModuleContext'
import stringify from '../../utils/stringify'
import { SFCDescriptor } from '../../types/compiler'
import mpxGlobal from '../mpx'
import { createDescriptor } from '../utils/descriptorCache'
import pathHash from '../../utils/pageHash'
import createJSONHelper from '../../transfrom/json-helper'
import toPosix from '@mpxjs/compile-utils/to-posix'
import mpx from "../../webpack/mpx";
import parser from "@mpxjs/compiler/template-compiler/parser";
import { mpxJSONTransform } from '../../transfrom/json-compiler'

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
  subpackages: {
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
 * dep entry/packages/sub-packages to collect pages/components/tabbar
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
export async function resolveJson(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<JsonConfig> {
  const { defs } = options
  const { json } = descriptor
  let content = json?.content || '{}'
  if (json) {
    content = await getJSONContent(
      json,
      descriptor.filename,
      proxyPluginContext(pluginContext),
      defs,
      fs
    )
  }
  return json5.parse(content)
}
export async function processJSON(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<void> {
  const {
    processPage,
    processComponent
  } = createJSONHelper({
    pluginContext: proxyPluginContext(pluginContext),
    mpx: mpxGlobal,
    type: 'vite'
  })

  const jsonConfig = (descriptor.jsonConfig = await resolveJson(
    descriptor,
    options,
    pluginContext
  ))
  const { filename } = descriptor
  const localPagesMap: SFCDescriptor['localPagesMap'] = {}
  const localComponentsMap: SFCDescriptor['localComponentsMap'] = {}

  let tabBarMap: Record<string, unknown> = {}
  let tabBarStr = ''

  const defaultTabbar = {
    borderStyle: 'black',
    position: 'bottom',
    custom: false,
    isShow: true
  }

  function emitWarning(msg: string | Error) {
    proxyPluginContext(pluginContext).warn('[json processor]: ' + msg)
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

  const pageKeySet = new Set()
  const processPages = async (
    pages: JsonConfig['pages'] = [],
    importer: string,
    tarRoot = ''
  ) => {
    const context = resolveModuleContext(importer)
    for (const page of pages) {
      let { entry: { outputPath, resource } = {}, key } = await processPage(page, context, tarRoot)
      if (!pageKeySet.has(key)) {
        pageKeySet.add(key)
        const { resourcePath, queryObj } = parseRequest(resource)
        if (localPagesMap[outputPath]) {
          const { resourcePath: oldResourcePath } = parseRequest(localPagesMap[outputPath].resource)
          if (oldResourcePath !== resourcePath) {
            const oldOutputPath = outputPath
            outputPath = mpx.getOutputPath && mpx.getOutputPath(resourcePath, 'page', { conflictPath: outputPath })
            emitWarning(new Error(`Current page [${ resourcePath }] is registered with a conflict outputPath [${ oldOutputPath }] which is already existed in system, will be renamed with [${ outputPath }], use ?resolve to get the real outputPath!`))
          }
        }
        mpxGlobal.pagesMap[resourcePath] = outputPath
        mpxGlobal.pagesEntryMap[resourcePath] = importer
        // resolved page
        localPagesMap[outputPath] = {
          resource,
          async: queryObj.async || tarRoot
        }
      }
    }
  }

  const processComponents = async (
    components: JsonConfig['usingComponents'],
    importer: string
  ) => {
    // console.log('=====local')
    for (const key in components) {
      let { entry: { outputPath, resource } } = await processComponent(components[key], importer, {})
      const { resourcePath, queryObj } = parseRequest(resource)
      mpxGlobal.componentsMap[resourcePath] = outputPath
      localComponentsMap[key] = {
        resource: addQuery(resource, {
          isComponent: true,
          outputPath
        }),
        async: queryObj.async
      }
    }
  }

  const processGenerics = async (
    generics: JsonConfig['componentGenerics'] = {},
    importer: string
  ) => {
    if (generics) {
      const genericsComponents = {}
      Object.keys(generics).forEach((name) => {
        const generic = generics[name]
        if (generic.default) genericsComponents[`${ name }default`] = generic.default
      })
      await processComponents(genericsComponents, importer)
    }
  }

  const processPackages = async (
    packages: JsonConfig['packages'] = [],
    context: string
  ) => {
    if (packages) {
      for (const packagePath of packages) {
        const { queryObj } = parseRequest(packagePath)
        const packageModule = await proxyPluginContext(pluginContext).resolve(packagePath, context)
        if (packageModule) {
          const packageId = packageModule.id
          pluginContext.addWatchFile(packageId)
          const { rawResourcePath } = parseRequest(packageId)
          const code = await fs.promises.readFile(rawResourcePath, 'utf-8')
          const extName = extname(rawResourcePath)
          if (extName === '.mpx') {
            const descriptor = createDescriptor(packageId, code, queryObj, options)
            const { pages, packages } = (descriptor.jsonConfig = await resolveJson(
              descriptor,
              options,
              pluginContext))
            const processSelfQueue = []
            // const context = dirname(rawResourcePath)
            const context = packageId
            if (pages) {
              processSelfQueue.push(processPages(pages, context, queryObj.root))
            }
            if (packages) {
              processSelfQueue.push(processPackages(packages, context))
            }
            if (processSelfQueue.length) {
              await Promise.all(processSelfQueue)
            }
          }
        }
      }
    }
  }

  const processSubPackages = async (
    subPackages: JsonConfig['subpackages'] = [],
    context: string
  ) => {
    for (const subPackage of subPackages) {
      processSubPackage(subPackage, context)
    }
  }
  const processSubPackage = async (subPackage, context) => {
    if (subPackage) {
      if (typeof subPackage.root === 'string' && subPackage.root.startsWith('.')) {
        proxyPluginContext(pluginContext).error(`Current subpackage root [${ subPackage.root }] is not allow starts with '.'`)
        return `Current subpackage root [${ subPackage.root }] is not allow starts with '.'`
      }
      const tarRoot = subPackage.tarRoot || subPackage.root || ''
      // const srcRoot = subPackage.srcRoot || subPackage.root || ''
      if (tarRoot) {
        // context = join(context, srcRoot)
        processPages(subPackage.pages, context, tarRoot)
      }
    }
  }

  try {
    await Promise.all([
      processPages(jsonConfig.pages, filename),
      processPackages(jsonConfig.packages, filename),
      processSubPackages(jsonConfig.subpackages, filename),
      processComponents(jsonConfig.usingComponents, filename),
      processGenerics(jsonConfig.componentGenerics, filename),
      processTabBar(jsonConfig.tabBar)
    ])

    descriptor.localPagesMap = localPagesMap
    descriptor.localComponentsMap = localComponentsMap
    descriptor.tabBarMap = tabBarMap
    descriptor.tabBarStr = tabBarStr
  } catch (error) {
    proxyPluginContext(pluginContext).error(`[mpx loader] process json error: ${ error }`)
  }
}
