import { each, waterfall, parallel, eachOf } from 'async'
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
import { RESOLVE_IGNORED_ERR } from '../../constants'
import RecordResourceMapDependency from '@mpxjs/webpack-plugin/lib/dependencies/RecordResourceMapDependency'
import { proxyPluginContext } from '../../pluginContextProxy'
import mpx from '../mpx'
import fs from "fs";

export default async function (json, {
  loaderContext,
  pagesMap,
  componentsMap
}) {
  const localPagesMap = {}
  const localComponentsMap = {}
  let output = '/* json */\n'
  let jsonObj = {}
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


  if (!json) {
    return {
      output,
      jsonObj,
      localPagesMap,
      localComponentsMap,
      tabBarMap,
      tabBarStr
    }
  }
  // 由于json需要提前读取在template处理中使用，src的场景已经在loader中处理了，此处无需考虑json.src的场景
  try {
    jsonObj = parse(json.content)
  } catch (e) {
    return {
      output,
      jsonObj,
      localPagesMap,
      localComponentsMap,
      tabBarMap,
      tabBarStr
    }
  }

  const fs = loaderContext._compiler.inputFileSystem

  const defaultTabbar = {
    borderStyle: 'black',
    position: 'bottom',
    custom: false,
    isShow: true
  }

  const processTabBar = (tabBar) => {
    if (tabBar) {
      tabBar = Object.assign({}, defaultTabbar, tabBar)
      tabBarMap = {}
      jsonObj.tabBar.list.forEach(({ pagePath }) => {
        tabBarMap[pagePath] = true
      })
      tabBarStr = JSON.stringify(tabBar)
      tabBarStr = tabBarStr.replace(/"(iconPath|selectedIconPath)":"([^"]+)"/g, function (matched, $1, $2) {
        if (isUrlRequest($2, projectRoot)) {
          return `"${$1}":require(${stringifyRequest(urlToRequest($2, projectRoot))})`
        }
        return matched
      })
    }
  }

  const processPackages = (packages, context) => {
    if (packages) {
      each(packages, async (packagePath) => {
        const { queryObj } = parseRequest(packagePath)
        const { rawResourcePath } = resolve(context, packagePath, loaderContext, (err, result) => {
          if (err) return error
          return parseRequest(result)
        })
        const code = await fs.promises.readFile(rawResourcePath, 'utf-8')
        const extName = extname(rawResourcePath)
        if (extName === '.mpx') {
          const parts = parser(code, {
            filePath: result,
            needMap: loaderContext.sourceMap,
            mode,
            env
          })
          const JSONContent = await getJSONContent(
            parts.json || {},
            loaderContext.context,
            proxyPluginContext(loaderContext),
            mpx.defs,
            loaderContext._compilation.inputFileSystem
          )
          let content = ''
          try {
            content = parse(JSONContent)
          } catch (err) {
            return err
          }

          const processSelfQueue = []
          const context = dirname(rawResourcePath)
          if (content.pages) {
            let tarRoot = queryObj.root
            if (tarRoot) {
              delete queryObj.root
              let subPackage = {
                tarRoot,
                pages: content.pages,
                ...queryObj
              }

              if (content.plugins) {
                subPackage.plugins = content.plugins
              }

              processSelfQueue.push(() => {
                processSubPackage(subPackage, context)
              })
            } else {
              processSelfQueue.push(() => {
                processPages(content.pages, context, '')
              })
            }
          }
          if (content.packages) {
            processSelfQueue.push(() => {
              processPackages(content.packages, context)
            })
          }
          if (processSelfQueue.length) {
            parallel(processSelfQueue, callback)
          }
        }
      })
    }
  }

  const pageKeySet = new Set()

  const processPages = (pages, context, tarRoot = '') => {
    if (pages) {
      each(pages, async (page) => {
        await processPage(page, context, tarRoot, (err, { resource, outputPath } = {}, { isFirst, key } = {}) => {
          if (err) return err === RESOLVE_IGNORED_ERR ? null : err
          if (pageKeySet.has(key)) return null
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
          localPagesMap[outputPath] = {
            resource: addQuery(resource, { isPage: true }),
            async: queryObj.async || tarRoot,
            isFirst
          }
          loaderContext._module && loaderContext._module.addPresentationalDependency(new RecordResourceMapDependency(resourcePath, 'page', outputPath))
        })
      })
    }
  }

  const processSubPackage = (subPackage, context) => {
    if (subPackage) {
      if (typeof subPackage.root === 'string' && subPackage.root.startsWith('.')) {
        emitError(`Current subpackage root [${subPackage.root}] is not allow starts with '.'`)
        return
      }
      let tarRoot = subPackage.tarRoot || subPackage.root || ''
      let srcRoot = subPackage.srcRoot || subPackage.root || ''
      if (!tarRoot) return
      context = join(context, srcRoot)
      processPages(subPackage.pages, context, tarRoot)
    }
  }

  const processSubPackages = (subPackages, context) => {
    if (subPackages) {
      each(subPackages, (subPackage) => {
        processSubPackage(subPackage, context)
      })
    }
  }

  const processComponents = (components, context) => {
    if (components) {
      eachOf(components, (component, name) => {
        processComponent(component, context, {}, (err, { resource, outputPath } = {}) => {
          if (err === RESOLVE_IGNORED_ERR) {
            return 'error'
          }
          const { resourcePath, queryObj } = parseRequest(resource)
          componentsMap[resourcePath] = outputPath
          loaderContext._module && loaderContext._module.addPresentationalDependency(new RecordResourceMapDependency(resourcePath, 'component', outputPath))
          localComponentsMap[name] = {
            resource: addQuery(resource, {
              isComponent: true,
              outputPath
            }),
            async: queryObj.async
          }
        })
      })
    }
  }

  const processGenerics = (generics, context) => {
    if (generics) {
      const genericsComponents = {}
      Object.keys(generics).forEach((name) => {
        const generic = generics[name]
        if (generic.default) genericsComponents[`${name}default`] = generic.default
      })
      processComponents(genericsComponents, context)
    }
  }

  try {
    if (jsonObj.pages && jsonObj.pages[0]) {
      if (typeof jsonObj.pages[0] !== 'string') {
        jsonObj.pages[0].src = addQuery(jsonObj.pages[0].src, { isFirst: true })
      } else {
        jsonObj.pages[0] = addQuery(jsonObj.pages[0], { isFirst: true })
      }
    }
    await processPages(jsonObj.pages, context, '')
    await processComponents(jsonObj.usingComponents, context)
    await processPackages(jsonObj.packages, context)
    await processSubPackages(jsonObj.subPackages || jsonObj.subpackages, context)
    await processGenerics(jsonObj.componentGenerics, context)
    await processTabBar(jsonObj.tabBar)
    return {
      output,
      jsonObj,
      localPagesMap,
      localComponentsMap,
      tabBarMap,
      tabBarStr
    }
  } catch (error) {
    pluginContext.error(`[mpx loader] process json error: ${error}`)
  }
}
