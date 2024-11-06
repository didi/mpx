const async = require('async')
const path = require('path')
const JSON5 = require('json5')
const loaderUtils = require('loader-utils')
const parseRequest = require('../utils/parse-request')
const toPosix = require('../utils/to-posix')
const addQuery = require('../utils/add-query')
const parseComponent = require('../parser')
const getJSONContent = require('../utils/get-json-content')
const resolve = require('../utils/resolve')
const createJSONHelper = require('../json-compiler/helper')
const getRulesRunner = require('../platform/index')
const { RESOLVE_IGNORED_ERR } = require('../utils/const')
const RecordResourceMapDependency = require('../dependencies/RecordResourceMapDependency')
const RecordGlobalComponentsDependency = require('../dependencies/RecordGlobalComponentsDependency')

module.exports = function (json, {
  loaderContext,
  ctorType,
  pagesMap,
  componentsMap
}, rawCallback) {
  const localPagesMap = {}
  const localComponentsMap = {}
  const output = '/* json */\n'
  let jsonObj = {}
  let tabBarMap
  let tabBarStr
  const mpx = loaderContext.getMpx()
  const {
    mode,
    srcMode,
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

  const stringifyRequest = r => loaderUtils.stringifyRequest(loaderContext, r)

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
        // 输出react时组件outputPath不需要拼接packageRoot
        outputPath: type === 'page' ? toPosix(path.join(packageRoot, outputPath)) : outputPath,
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

  const isApp = ctorType === 'app'
  if (!json) {
    return callback()
  }
  // 由于json需要提前读取在template处理中使用，src的场景已经在loader中处理了，此处无需考虑json.src的场景
  try {
    jsonObj = JSON5.parse(json.content)
    // 处理runner
    const rulesRunnerOptions = {
      mode,
      srcMode,
      type: 'json',
      waterfall: true,
      warn: emitWarning,
      error: emitError,
      data: {
        // polyfill global usingComponents & record globalComponents
        globalComponents: mpx.globalComponents
      }
    }

    if (!isApp) {
      rulesRunnerOptions.mainKey = ctorType
    }

    const rulesRunner = getRulesRunner(rulesRunnerOptions)

    if (rulesRunner) {
      rulesRunner(jsonObj)
    }
    if (isApp) {
      // 收集全局组件
      Object.assign(mpx.globalComponents, jsonObj.usingComponents)
      // 在 rulesRunner 运行后保存全局注册组件
      loaderContext._module.addPresentationalDependency(new RecordGlobalComponentsDependency(mpx.globalComponents, loaderContext.context))
    }
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
      async.each(packages, (packagePath, callback) => {
        const { queryObj } = parseRequest(packagePath)
        async.waterfall([
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
            const extName = path.extname(result)
            if (extName === '.mpx') {
              const parts = parseComponent(content, {
                filePath: result,
                needMap: loaderContext.sourceMap,
                mode,
                env
              })
              getJSONContent(parts.json || {}, result, loaderContext, (err, content) => {
                callback(err, result, content)
              })
            } else {
              callback(null, result, content)
            }
          },
          (result, content, callback) => {
            try {
              content = JSON5.parse(content)
            } catch (err) {
              return callback(err)
            }

            const processSelfQueue = []
            const context = path.dirname(result)

            if (content.pages) {
              const tarRoot = queryObj.root
              if (tarRoot) {
                delete queryObj.root
                const subPackage = {
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
              async.parallel(processSelfQueue, callback)
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
      async.each(pages, (page, callback) => {
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
      const tarRoot = subPackage.tarRoot || subPackage.root || ''
      const srcRoot = subPackage.srcRoot || subPackage.root || ''
      if (!tarRoot) return callback()
      context = path.join(context, srcRoot)
      processPages(subPackage.pages, context, tarRoot, callback)
    } else {
      callback()
    }
  }

  const processSubPackages = (subPackages, context, callback) => {
    if (subPackages) {
      async.each(subPackages, (subPackage, callback) => {
        processSubPackage(subPackage, context, callback)
      }, callback)
    } else {
      callback()
    }
  }

  const processComponents = (components, context, callback) => {
    if (components) {
      async.eachOf(components, (component, name, callback) => {
        processComponent(component, context, {}, (err, { resource, outputPath } = {}, { tarRoot } = {}) => {
          if (err) return callback(err === RESOLVE_IGNORED_ERR ? null : err)
          const { resourcePath, queryObj } = parseRequest(resource)
          componentsMap[resourcePath] = outputPath
          loaderContext._module && loaderContext._module.addPresentationalDependency(new RecordResourceMapDependency(resourcePath, 'component', outputPath))
          localComponentsMap[name] = {
            resource: addQuery(resource, {
              isComponent: true,
              outputPath
            }),
            async: queryObj.async || tarRoot
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

  async.parallel([
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
