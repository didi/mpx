import { join, extname, dirname } from 'path'
import { parse } from 'json5'
import { stringifyRequest as _stringifyRequest } from 'loader-utils'
import parseRequest from '@mpxjs/compile-utils/parse-request'
import toPosix from '@mpxjs/compile-utils/to-posix'
import addQuery from '@mpxjs/compile-utils/add-query'
import resolve from '@mpxjs/compile-utils/resolve'
import parser from '@mpxjs/compiler/template-compiler/parser'
import getJSONContent from '../../utils/get-json-content'
import createJSONHelper from '../json-compiler/helper'
import RecordResourceMapDependency from '@mpxjs/webpack-plugin/lib/dependencies/RecordResourceMapDependency'
import { proxyPluginContext } from '../../pluginContextProxy'
import stringify from '../../utils/stringify'
import mpx from '../mpx'
import fs from 'fs';

export default async function (json, {
  loaderContext,
  pagesMap,
  componentsMap
}, rawCallback) {
  const localPagesMap = {}
  const localComponentsMap = {}
  let output = '/* json */\n'
  let jsonConfig = {}
  let tabBarMap
  let tabBarStr
  const {
    mode,
    env,
    projectRoot
  } = mpx

  const context = loaderContext.context

  const emitWarning = (msg) => {
    loaderContext.emitWarning(
      new Error('[json processor][' + loaderContext.resource + ']: ' + msg)
    )
  }

  const emitError = (msg) => {
    loaderContext.emitError(
      new Error('[json compiler][' + loaderContext.resource + ']: ' + msg)
    )
  }

  const stringifyRequest = r => _stringifyRequest(loaderContext, r)

  const {
    isUrlRequest,
    urlToRequest,
    processPage,
    processComponent
  } = createJSONHelper({
    loaderContext,
    emitWarning,
    emitError,
    customGetDynamicEntry (resource, type, outputPath, packageRoot) {
      return {
        resource,
        outputPath: toPosix(join(packageRoot, outputPath)),
        packageRoot
      }
    }
  })

  const callback = (err) => {
    return rawCallback(err, {
      output,
      jsonConfig,
      localPagesMap,
      localComponentsMap,
      tabBarMap,
      tabBarStr
    })
  }

  if (!json) {
    return callback()
  }
  // 由于json需要提前读取在template处理中使用，src的场景已经在loader中处理了，此处无需考虑json.src的场景
  try {
    jsonConfig = parse(json.content)
  } catch (e) {
    return callback(e)
  }

  const defaultTabbar = {
    borderStyle: 'black',
    position: 'bottom',
    custom: false,
    isShow: true
  }

  const processTabBar = async (tabBar) => {
    if (tabBar) {
      tabBar = Object.assign({}, defaultTabbar, tabBar)
      tabBarMap = {}
      jsonConfig.tabBar.list.forEach(({ pagePath }) => {
        tabBarMap[pagePath] = true
      })
      tabBarStr = stringify(tabBar)
      tabBarStr = tabBarStr.replace(/"(iconPath|selectedIconPath)":"([^"]+)"/g, function (matched, $1, $2) {
        // 引用本地路径无法识别
        if (isUrlRequest($2, projectRoot)) {
          return `"${$1}":require(${stringifyRequest(urlToRequest($2, projectRoot))})`
        }
        return matched
      })
    }
  }

  const processPackages = async (packages, context) => {
    if (packages) {
      for (const packagePath of packages) {
        const { queryObj } = parseRequest(packagePath)
        const { resource } = await resolve(context, packagePath, loaderContext)
        if (resource) {
          let { rawResourcePath } = parseRequest(resource)
          let code = await fs.promises.readFile(rawResourcePath, 'utf-8')
          const extName = extname(rawResourcePath)
          if (extName === '.mpx') {
            const parts = parser(code, {
              filePath: rawResourcePath,
              needMap: loaderContext.sourceMap,
              mode,
              env
            })
            let JSONContent = await getJSONContent(
              parts.json || {},
              loaderContext.context,
              proxyPluginContext(loaderContext),
              mpx.defs,
              loaderContext._compilation.inputFileSystem
            )
            try {
              JSONContent = parse(JSONContent)
            } catch (err) {
              return err
            }
            const processSelfQueue = []
            const context = dirname(rawResourcePath)
            if (JSONContent.pages) {
              let tarRoot = queryObj.root
              if (tarRoot) {
                delete queryObj.root
                let subPackage = {
                  tarRoot,
                  pages: JSONContent.pages,
                  ...queryObj
                }

                if (JSONContent.plugins) {
                  subPackage.plugins = JSONContent.plugins
                }

                processSelfQueue.push(() => {
                  processSubPackage(subPackage, context)
                })
              } else {
                processSelfQueue.push(() => {
                  processPages(JSONContent.pages, context, '')
                })
              }
            }
            if (JSONContent.packages) {
              processSelfQueue.push(() => {
                processPackages(JSONContent.packages, context)
              })
            }
            if (processSelfQueue.length) {
              Promise.all(processSelfQueue)
            }
          }
        }
      }
    }
  }

  const pageKeySet = new Set()

  const processPages = async (pages, context, tarRoot = '') => {
    if (pages) {
      for (const page of pages) {
        let { entry: { outputPath, resource } = {}, isFirst, key } = await processPage(page, context, tarRoot)
        if (pageKeySet.has(key)) return callback()
        pageKeySet.add(key)
        const { resourcePath, queryObj } = parseRequest(resource)
        if (localPagesMap[outputPath]) {
          const { resourcePath: oldResourcePath } = parseRequest(localPagesMap[outputPath].resource)
          if (oldResourcePath !== resourcePath) {
            const oldOutputPath = outputPath
            outputPath = mpx.getOutputPath(resourcePath, 'page', { conflictPath: outputPath })
            emitWarning(new Error(`Current page [${resourcePath}] is registered with a conflict outputPath [${oldOutputPath}] which is already existed in system, will be renamed with [${outputPath}], use ?resolve to get the real outputPath!`))
          }
        }

        pagesMap[resourcePath] = outputPath
        loaderContext._module && loaderContext._module.addPresentationalDependency(new RecordResourceMapDependency(resourcePath, 'page', outputPath))
        localPagesMap[outputPath] = {
          resource: addQuery(resource, { isPage: true }),
          async: queryObj.async || tarRoot,
          isFirst
        }
      }
    }
  }

  const processSubPackage = async (subPackage, context) => {
    if (subPackage) {
      if (typeof subPackage.root === 'string' && subPackage.root.startsWith('.')) {
        emitError(`Current subpackage root [${subPackage.root}] is not allow starts with '.'`)
        return `Current subpackage root [${subPackage.root}] is not allow starts with '.'`
      }
      let tarRoot = subPackage.tarRoot || subPackage.root || ''
      let srcRoot = subPackage.srcRoot || subPackage.root || ''
      if (!tarRoot) return null
      context = join(context, srcRoot)
      processPages(subPackage.pages, context, tarRoot)
    }
  }

  const processSubPackages = async (subPackages, context) => {
    if (subPackages) {
      for (const subPackage of subPackages) {
        processSubPackage(subPackage, context)
      }
    }
  }

  const processComponents = async (components, context) => {
    if (components) {
      for (const key in components) {
        let { entry: { outputPath, resource } } = await processComponent(components[key], context, {})
        const { resourcePath, queryObj } = parseRequest(resource)
        componentsMap[resourcePath] = outputPath
        loaderContext._module && loaderContext._module.addPresentationalDependency(new RecordResourceMapDependency(resourcePath, 'component', outputPath))
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

  const processGenerics = async (generics, context) => {
    if (generics) {
      const genericsComponents = {}
      Object.keys(generics).forEach((name) => {
        const generic = generics[name]
        if (generic.default) genericsComponents[`${name}default`] = generic.default
      })
      processComponents(genericsComponents, context)
    }
  }

  if (jsonConfig.pages && jsonConfig.pages[0]) {
    if (typeof jsonConfig.pages[0] !== 'string') {
      jsonConfig.pages[0].src = addQuery(jsonConfig.pages[0].src, { isFirst: true })
    } else {
      jsonConfig.pages[0] = addQuery(jsonConfig.pages[0], { isFirst: true })
    }
  }
  await Promise.all([
    processPages(jsonConfig.pages, context, ''),
    processComponents(jsonConfig.usingComponents, context),
    processPackages(jsonConfig.packages, context),
    processSubPackages(jsonConfig.subPackages || jsonConfig.subpackages, context),
    processGenerics(jsonConfig.componentGenerics),
    processTabBar(jsonConfig.tabBar)
  ])
  callback()
}
