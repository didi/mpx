import {
  addQuery,
  parseRequest,
  resolveModuleContext
} from '@mpxjs/compile-utils'
import { proxyPluginContext } from '@mpxjs/plugin-proxy'
import RecordResourceMapDependency from '@mpxjs/webpack-plugin/lib/dependencies/RecordResourceMapDependency'
import fs from 'fs'
import { dirname, extname, join } from 'path'
import { PluginContext } from 'rollup'
import { LoaderContext } from 'webpack'
import { Options } from '../options'
import { JsonConfig, jsonCompiler, templateCompiler } from '@mpxjs/compiler'
import getOutputPath from '../utils/get-output-path'
import { createDescriptor } from '../vite/utils/descriptor-cache'
import { Mpx } from '../webpack/mpx'
import createJSONHelper from './json-helper'

export type JsonProcessResult = {
  localPagesMap: {
    [key: string]: {
      resource: string
      async: boolean
    }
  }
  localComponentsMap: {
    [key: string]: {
      resource: string
      async: boolean
    }
  }
  tabBarMap: Record<string, unknown>
  jsonConfig: JsonConfig
}

export const jsonProcess = async function ({
  jsonConfig,
  pluginContext,
  context,
  options,
  mode,
  mpx
}: {
  jsonConfig: JsonConfig
  pluginContext: LoaderContext<null> | PluginContext | any
  context: string
  options: Options
  mode: 'vite' | 'webpack'
  mpx?: Mpx
}): Promise<JsonProcessResult> {
  const localPagesMap: JsonProcessResult['localPagesMap'] = {}
  const localComponentsMap: JsonProcessResult['localComponentsMap'] = {}
  const mpxPluginContext = proxyPluginContext(pluginContext)
  let tabBarMap: JsonProcessResult['tabBarMap'] = {}
  const { emitWarning, processPage, processComponent } = createJSONHelper({
    pluginContext,
    options,
    mode
  })

  const processTabBar = async (tabBar: JsonConfig['tabBar']) => {
    if (tabBar) {
      tabBarMap = {}
      tabBar?.list?.forEach(({ pagePath }: { pagePath: string }) => {
        tabBarMap[pagePath] = true
      })
    }
  }

  const pageKeySet = new Set()
  const processPages = async (
    pages: JsonConfig['pages'] = [],
    importer: string,
    tarRoot = ''
  ) => {
    const context = mode === 'vite' ? resolveModuleContext(importer) : importer
    for (const page of pages) {
      const pageModule = await processPage(page, context, tarRoot)
      if (pageModule) {
        const { key, resource } = pageModule
        let { outputPath } = pageModule
        if (!pageKeySet.has(key)) {
          pageKeySet.add(key)
          const { resourcePath, queryObj } = parseRequest(resource)
          if (localPagesMap[outputPath]) {
            const oldResource = localPagesMap[outputPath]?.resource || ''
            const { resourcePath: oldResourcePath } = parseRequest(oldResource)
            if (oldResourcePath !== resourcePath) {
              const oldOutputPath = outputPath
              outputPath = getOutputPath(resourcePath, 'page', options, {
                conflictPath: outputPath
              })
              emitWarning(
                `Current page [${resourcePath}] is registered with a conflict outputPath [${oldOutputPath}] which is already existed in system, will be renamed with [${outputPath}], use ?resolve to get the real outputPath!`
              )
            }
          }
          mpx && (mpx.pagesMap[resourcePath] = outputPath)
          if (mode === 'webpack') {
            pluginContext._module &&
              pluginContext._module.addPresentationalDependency(
                new RecordResourceMapDependency(
                  resourcePath,
                  'page',
                  outputPath,
                  ''
                )
              )
          }
          // todo 确认是不是 vite 可以不用
          // mpx.pagesEntryMap[resourcePath] = importer
          localPagesMap[outputPath] = {
            resource,
            async: !!queryObj.async || !!tarRoot
          }
        }
      }
    }
  }

  const processComponents = async (
    components: JsonConfig['usingComponents'],
    context: string
  ) => {
    if (components) {
      for (const key in components) {
        const componentModule = await processComponent(
          components[key],
          context,
          {}
        )
        if (componentModule) {
          const { resource, outputPath } = componentModule
          const { resourcePath, queryObj } = parseRequest(resource)

          if (mode === 'webpack') {
            pluginContext._module &&
              pluginContext._module.addPresentationalDependency(
                new RecordResourceMapDependency(
                  resourcePath,
                  'component',
                  outputPath,
                  ''
                )
              )
            mpx && (mpx.componentsMap.main[resourcePath] = outputPath)
          } else {
            mpx && (mpx.componentsMap[resourcePath] = outputPath)
          }
          localComponentsMap[key] = {
            resource: addQuery(resource, {
              isComponent: true,
              outputPath
            }),
            async: !!queryObj.async
          }
        }
      }
    }
  }

  const processGenerics = async (
    generics: JsonConfig['componentGenerics'] = {},
    context: string
  ) => {
    if (generics) {
      const genericsComponents: Record<string, string> = {}
      Object.keys(generics).forEach(name => {
        const generic = generics[name]
        if (generic.default) {
          genericsComponents[`${name}default`] = generic.default
        }
      })
      await processComponents(genericsComponents, context)
    }
  }

  const processPackages = async (
    packages: JsonConfig['packages'] = [],
    context: string
  ) => {
    if (packages) {
      for (const packagePath of packages) {
        const { queryObj } = parseRequest(packagePath)
        const packageModule = await mpxPluginContext.resolve(
          packagePath,
          context
        )
        if (!packageModule || !packageModule.id) return
        const resource = packageModule.id
        const { rawResourcePath } = parseRequest(resource)
        const code = await fs.promises.readFile(rawResourcePath, 'utf-8')
        const extName = extname(rawResourcePath)
        if (extName === '.mpx') {
          const processSelfQueue = []
          let jsonConfig: JsonConfig
          let context = ''
          if (mode === 'webpack') {
            context = dirname(rawResourcePath)
            const parts = templateCompiler.parser(code, {
              filePath: rawResourcePath,
              needMap: pluginContext.sourceMap,
              mode: options.mode,
              env: options.env
            })
            jsonConfig = await jsonCompiler.parse(
              parts,
              pluginContext.context,
              pluginContext,
              options,
              pluginContext._compilation.inputFileSystem
            )
          } else {
            context = resource
            const descriptor = createDescriptor(
              resource,
              code,
              queryObj,
              options
            )
            jsonConfig = descriptor.jsonConfig = await jsonCompiler.parse(
              descriptor,
              descriptor.filename,
              pluginContext,
              options
            )
            pluginContext.addWatchFile(resource)
          }
          const { pages, packages } = jsonConfig

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

  const processSubPackages = async (
    subPackages: JsonConfig['subpackages'] = [],
    context: string
  ) => {
    for (const subPackage of subPackages) {
      processSubPackage(subPackage, context)
    }
  }

  const processSubPackage = async (
    subPackage: {
      root?: 'string'
      pages: JsonConfig['pages']
    },
    context: string
  ) => {
    if (subPackage) {
      if (
        typeof subPackage.root === 'string' &&
        subPackage.root.startsWith('.')
      ) {
        mpxPluginContext.error(
          `Current subpackage root [${subPackage.root}] is not allow starts with '.'`
        )
        return `Current subpackage root [${subPackage.root}] is not allow starts with '.'`
      }
      if (subPackage.root) {
        if (mode === 'webpack') {
          context = join(context, subPackage.root)
        }
        processPages(subPackage.pages, context, subPackage.root)
      }
    }
  }

  await Promise.all([
    processPages(jsonConfig.pages, context),
    processPackages(jsonConfig.packages, context),
    processSubPackages(jsonConfig.subpackages, context),
    processComponents(jsonConfig.usingComponents, context),
    processGenerics(jsonConfig.componentGenerics, context),
    processTabBar(jsonConfig.tabBar)
  ])
  return {
    jsonConfig,
    localPagesMap,
    localComponentsMap,
    tabBarMap
  }
}
