import { each, waterfall, parallel, eachOf } from 'async'
import { join, extname, dirname } from 'path'
import { parse } from 'json5'
import { stringifyRequest as _stringifyRequest } from 'loader-utils'
import parseRequest from '@mpxjs/utils/parse-request'
import toPosix from '@mpxjs/utils/to-posix'
import addQuery from '@mpxjs/utils/add-query'
import resolve from '../utils/resolve'
import parser from '@mpxjs/compiler/template-compiler/parser'
import getJSONContent from '../../utils/get-json-content'
import createJSONHelper from '../json-compiler/helper'
import { RESOLVE_IGNORED_ERR } from '../../constants'
import RecordResourceMapDependency from '@mpxjs/webpack-plugin/lib/dependencies/RecordResourceMapDependency'
import { proxyPluginContext } from 'src/pluginContextProxy'
import { mpx } from '../../mpx'

export default function (json, {
  loaderContext,
  pagesMap,
  componentsMap
}, rawCallback) {
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

  const callback = (err) => {
    return rawCallback(err, {
      output,
      jsonObj,
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
    jsonObj = parse(json.content)
  } catch (e) {
    return callback(e)
  }

  const fs = loaderContext._compiler.inputFileSystem

  const defaultTabbar = {
    borderStyle: 'black',
    position: 'bottom',
    custom: false,
    isShow: true
  }

  const processTabBar = (tabBar, callback) => {
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
    callback()
  }

  const processPackages = (packages, context, callback) => {
    if (packages) {
      each(packages, (packagePath, callback) => {
        const { queryObj } = parseRequest(packagePath)
        waterfall([
          (callback) => {
            resolve(context, packagePath, loaderContext, (err, result) => {
              if (err) return callback(err)
              const { rawResourcePath } = parseRequest(result)
              callback(err, rawResourcePath)
            })
          },
          (result, callback) => {
            fs.readFile(result, (err, content) => {
              if (err) return callback(err)
              callback(err, result, content.toString('utf-8'))
            })
          },
          (result, content, callback) => {
            const extName = extname(result)
            if (extName === '.mpx') {
              const parts = parser(content, {
                filePath: result,
                needMap: loaderContext.sourceMap,
                mode,
                env
              })
              getJSONContent(
                parts.json || {},
                loaderContext.context,
                proxyPluginContext(loaderContext),
                mpx.defs,
                loaderContext._compilation.inputFileSystem
              ).then(res => {
                console.log(res);
                callback(null, result, res)
              }).catch(err=> {
                callback(err)
              })
            } else {
              callback(null, result, content)
            }
          },
          (result, content, callback) => {
            try {
              content = parse(content)
            } catch (err) {
              return callback(err)
            }

            const processSelfQueue = []
            const context = dirname(result)

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

                processSelfQueue.push((callback) => {
                  processSubPackage(subPackage, context, callback)
                })
              } else {
                processSelfQueue.push((callback) => {
                  processPages(content.pages, context, '', callback)
                })
              }
            }
            if (content.packages) {
              processSelfQueue.push((callback) => {
                processPackages(content.packages, context, callback)
              })
            }
            if (processSelfQueue.length) {
              parallel(processSelfQueue, callback)
            } else {
              callback()
            }
          }
        ], (err) => {
          callback(err === RESOLVE_IGNORED_ERR ? null : err)
        })
      }, callback)
    } else {
      callback()
    }
  }

  const pageKeySet = new Set()

  const processPages = (pages, context, tarRoot = '', callback) => {
    if (pages) {
      each(pages, (page, callback) => {
        processPage(page, context, tarRoot, (err, { resource, outputPath } = {}, { isFirst, key } = {}) => {
          if (err) return callback(err === RESOLVE_IGNORED_ERR ? null : err)
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
          callback()
        })
      }, callback)
    } else {
      callback()
    }
  }

  const processSubPackage = (subPackage, context, callback) => {
    if (subPackage) {
      if (typeof subPackage.root === 'string' && subPackage.root.startsWith('.')) {
        emitError(`Current subpackage root [${subPackage.root}] is not allow starts with '.'`)
        return callback()
      }
      let tarRoot = subPackage.tarRoot || subPackage.root || ''
      let srcRoot = subPackage.srcRoot || subPackage.root || ''
      if (!tarRoot) return callback()
      context = join(context, srcRoot)
      processPages(subPackage.pages, context, tarRoot, callback)
    } else {
      callback()
    }
  }

  const processSubPackages = (subPackages, context, callback) => {
    if (subPackages) {
      each(subPackages, (subPackage, callback) => {
        processSubPackage(subPackage, context, callback)
      }, callback)
    } else {
      callback()
    }
  }

  const processComponents = (components, context, callback) => {
    if (components) {
      eachOf(components, (component, name, callback) => {
        processComponent(component, context, {}, (err, { resource, outputPath } = {}) => {
          if (err === RESOLVE_IGNORED_ERR) {
            return callback()
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
          callback()
        })
      }, callback)
    } else {
      callback()
    }
  }

  const processGenerics = (generics, context, callback) => {
    if (generics) {
      const genericsComponents = {}
      Object.keys(generics).forEach((name) => {
        const generic = generics[name]
        if (generic.default) genericsComponents[`${name}default`] = generic.default
      })
      processComponents(genericsComponents, context, callback)
    } else {
      callback()
    }
  }

  parallel([
    (callback) => {
      // 添加首页标识
      if (jsonObj.pages && jsonObj.pages[0]) {
        if (typeof jsonObj.pages[0] !== 'string') {
          jsonObj.pages[0].src = addQuery(jsonObj.pages[0].src, { isFirst: true })
        } else {
          jsonObj.pages[0] = addQuery(jsonObj.pages[0], { isFirst: true })
        }
      }
      processPages(jsonObj.pages, context, '', callback)
    },
    (callback) => {
      processComponents(jsonObj.usingComponents, context, callback)
    },
    (callback) => {
      processPackages(jsonObj.packages, context, callback)
    },
    (callback) => {
      processSubPackages(jsonObj.subPackages || jsonObj.subpackages, context, callback)
    },
    (callback) => {
      processGenerics(jsonObj.componentGenerics, context, callback)
    },
    (callback) => {
      processTabBar(jsonObj.tabBar, callback)
    }
  ], callback)
}
