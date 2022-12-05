import { proxyPluginContext } from '../pluginContextProxy'
import createJSONHelper from './json-helper'
import { SFCDescriptor } from '../types/compiler'
import resolveModuleContext from '../utils/resolveModuleContext'
import stringify from '../utils/stringify'
import parseRequest from '@mpxjs/compile-utils/parse-request'
import { createDescriptor } from '../vite/utils/descriptorCache'
import { extname, dirname, join } from 'path'
import { JsonConfig } from '../types/json-config'
import addQuery from '@mpxjs/compile-utils/add-query'
import resolveJson from '../utils/resolve-json-content'
import fs from 'fs'
import { PluginContext } from 'rollup'
import { LoaderContext } from 'webpack'
import RecordResourceMapDependency from '@mpxjs/webpack-plugin/lib/dependencies/RecordResourceMapDependency';
import parser from '@mpxjs/compiler/template-compiler/parser'
import { Mpx } from '../types/mpx'
import getOutputPath from '../utils/get-output-path'

const defaultTabbar = {
  borderStyle: 'black',
  position: 'bottom',
  custom: false,
  isShow: true
}

export const jsonCompiler = async function ({ jsonConfig, pluginContext, context, mpx, mode }: {
  jsonConfig: JsonConfig,
  pluginContext: LoaderContext<null> | PluginContext | any,
  context: string,
  mpx: Mpx,
  mode: 'vite' | 'webpack'
}): Promise<{
  jsonConfig: JsonConfig
  localPagesMap: SFCDescriptor['localPagesMap'],
  localComponentsMap: SFCDescriptor['localComponentsMap'],
  tabBarMap: SFCDescriptor['tabBarMap'],
  tabBarStr: string
}> {
  const localPagesMap: SFCDescriptor['localPagesMap'] = {}
  const localComponentsMap: SFCDescriptor['localComponentsMap'] = {}
  const projectRoot = mpx.projectRoot || ''
  const mpxPluginContext = proxyPluginContext(pluginContext)
  let tabBarMap: SFCDescriptor['tabBarMap'] = {}
  let tabBarStr = ''
  const { stringifyRequest, emitWarning, urlToRequest, isUrlRequest, processPage, processComponent } = createJSONHelper({
    pluginContext,
    mpx,
    mode
  })

  const processTabBar = async (tabBar: JsonConfig['tabBar']) => {
    if (tabBar) {
      tabBar = { ...defaultTabbar, ...tabBar }
      tabBarMap = {}
      jsonConfig?.tabBar?.list?.forEach(({ pagePath }: { pagePath: string }) => {
        tabBarMap[pagePath] = true
      })
      tabBarStr = stringify(tabBar)

      tabBarStr = tabBarStr.replace(
        /"(iconPath|selectedIconPath)":"([^"]+)"/g,
        function (matched, $1, $2) {
          // vite 引用本地路径无法识别
          if (isUrlRequest($2, projectRoot) && mode === 'webpack') {
            return `"${ $1 }":require(${ stringifyRequest(urlToRequest($2, projectRoot)) })`
          }
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
    const context = mode === 'vite' ? resolveModuleContext(importer) : importer
    for (const page of pages) {
      const pageModule = await processPage(page, context, tarRoot)
      const { key, entry: { resource } } = pageModule
      let { entry: { outputPath } } = pageModule
      if (!pageKeySet.has(key)) {
        pageKeySet.add(key)
        const { resourcePath, queryObj } = parseRequest(resource)
        if (localPagesMap[outputPath]) {
          const oldResource = localPagesMap[outputPath]?.resource || ''
          const { resourcePath: oldResourcePath } = parseRequest(oldResource)
          if (oldResourcePath !== resourcePath) {
            const oldOutputPath = outputPath
            // todo
            outputPath = getOutputPath(resourcePath, 'page', mpx, { conflictPath: outputPath })
            emitWarning(new Error(`Current page [${ resourcePath }] is registered with a conflict outputPath [${ oldOutputPath }] which is already existed in system, will be renamed with [${ outputPath }], use ?resolve to get the real outputPath!`))
          }
        }
        mpx.pagesMap[resourcePath] = outputPath
        if (mode === 'webpack') {
          pluginContext._module && pluginContext._module.addPresentationalDependency(new RecordResourceMapDependency(resourcePath, 'page', outputPath, ''))
        }
        // todo 确认是不是 vite 可以不用
        // mpx.pagesEntryMap[resourcePath] = importer
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
    if (components) {
      for (const key in components) {
        const { entry: { outputPath, resource } } = await processComponent(components[key], importer, {})
        const { resourcePath, queryObj } = parseRequest(resource)

        if (mode === 'webpack') {
          pluginContext._module && pluginContext._module.addPresentationalDependency(new RecordResourceMapDependency(resourcePath, 'component', outputPath, ''))
          mpx.componentsMap['main'][resourcePath] = outputPath
        } else {
          mpx.componentsMap[resourcePath] = outputPath
        }
        localComponentsMap[key] = {
          resource: addQuery(resource, {
            isComponent: true,
            outputPath
          }),
          async: queryObj.async
        }
      }
    }
  }

  const processGenerics = async (
    generics: JsonConfig['componentGenerics'] = {},
    importer: string
  ) => {
    if (generics) {
      const genericsComponents: Record<string, string> = {}
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
        const packageModule = await mpxPluginContext.resolve(packagePath, context)
        if (packageModule) {
          const packageId = packageModule.id
          const { rawResourcePath } = parseRequest(packageId)
          const code = await fs.promises.readFile(rawResourcePath, 'utf-8')
          const extName = extname(rawResourcePath)
          if (extName === '.mpx') {
            const processSelfQueue = []
            let jsonConfig: JsonConfig = {}
            let context = ''
            if (mode === 'webpack') {
              context = dirname(rawResourcePath)
              const parts = parser(code, {
                filePath: rawResourcePath,
                needMap: pluginContext.sourceMap,
                mode: mpx.mode,
                env: mpx.env
              })
              jsonConfig = await resolveJson(
                parts,
                pluginContext.context,
                pluginContext,
                { defs: mpx.defs || {}},
                pluginContext._compilation.inputFileSystem
              )
            } else {
              context = packageId
              const { projectRoot = '', isProduction, mode = 'web', defs = {}, env = '', sourceMap } = mpx
              const descriptor = createDescriptor(packageId, code, queryObj, {
                projectRoot,
                isProduction,
                mode,
                defs,
                env,
                sourceMap
              })
              jsonConfig = (descriptor.jsonConfig = await resolveJson(descriptor, descriptor.filename, pluginContext, { defs: mpx.defs || {} }))
              pluginContext.addWatchFile(packageId)
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
  }

  const processSubPackages = async (
    subPackages: JsonConfig['subpackages'] = [],
    context: string
  ) => {
    for (const subPackage of subPackages) {
      processSubPackage(subPackage, context)
    }
  }

  const processSubPackage = async (subPackage: {
    root?: 'string'
    pages: JsonConfig['pages']
  }, context: string) => {
    if (subPackage) {
      if (typeof subPackage.root === 'string' && subPackage.root.startsWith('.')) {
        mpxPluginContext.error(`Current subpackage root [${ subPackage.root }] is not allow starts with '.'`)
        return `Current subpackage root [${ subPackage.root }] is not allow starts with '.'`
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
    tabBarMap,
    tabBarStr
  }
}
