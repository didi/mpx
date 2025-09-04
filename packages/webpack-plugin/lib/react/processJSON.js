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
const { transSubpackage } = require('../utils/trans-async-sub-rules')
const createJSONHelper = require('../json-compiler/helper')
const getRulesRunner = require('../platform/index')
const { RESOLVE_IGNORED_ERR } = require('../utils/const')
const RecordResourceMapDependency = require('../dependencies/RecordResourceMapDependency')
const RecordPageConfigsMapDependency = require('../dependencies/RecordPageConfigsMapDependency')

module.exports = function (jsonContent, {
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

  function fillInComponentsMap (name, entry, tarRoot) {
    const { resource, outputPath } = entry
    const { resourcePath } = parseRequest(resource)
    componentsMap[resourcePath] = outputPath
    loaderContext._module && loaderContext._module.addPresentationalDependency(new RecordResourceMapDependency(resourcePath, 'component', outputPath))
    localComponentsMap[name] = {
      resource: addQuery(resource, {
        isComponent: true,
        outputPath
      }),
      async: tarRoot
    }
  }

  const {
    isUrlRequest,
    urlToRequest,
    processPage,
    processComponent,
    processAsyncSubpackageRules
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

  if (!jsonContent) {
    return callback()
  }
  try {
    jsonObj = JSON5.parse(jsonContent)
    // 处理runner
    const rulesRunnerOptions = {
      mode,
      srcMode,
      type: 'json',
      waterfall: true,
      warn: emitWarning,
      error: emitError,
      data: {
        // polyfill global usingComponents
        globalComponents: mpx.globalComponents
      }
    }

    if (ctorType !== 'app') {
      rulesRunnerOptions.mainKey = ctorType
    }

    const rulesRunner = getRulesRunner(rulesRunnerOptions)

    if (rulesRunner) {
      rulesRunner(jsonObj)
    }
  } catch (e) {
    return callback(e)
  }

  if (ctorType === 'page') {
    const keysToExtract = ['navigationStyle', 'navigationBarTitleText', 'navigationBarTextStyle', 'navigationBarBackgroundColor']
    const configObj = {}
    // 暂时先不注入数据，后续如需要使用再用
    keysToExtract.forEach(key => {
      if (jsonObj[key]) {
        configObj[key] = jsonObj[key]
      }
    })
    loaderContext._module.addPresentationalDependency(new RecordPageConfigsMapDependency(parseRequest(loaderContext.resource).resourcePath, configObj))
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
          const { resourcePath } = parseRequest(resource)
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
          // 通过asyncSubPackagesNameRules对tarRoot进行修改，仅修改tarRoot，不修改outputPath页面路径
          tarRoot = transSubpackage(mpx.transSubpackageRules, tarRoot)
          localPagesMap[outputPath] = {
            resource: addQuery(resource, { isPage: true }),
            async: tarRoot,
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
      const asyncComponents = []
      const resolveResourcePathMap = new Map()
      async.eachOf(components, (component, name, callback) => {
        processComponent(component, context, {}, (err, entry = {}, { tarRoot, placeholder, resolveResourcePath } = {}) => {
          if (err) return callback(err === RESOLVE_IGNORED_ERR ? null : err)
          const { relativePath } = entry

          tarRoot = transSubpackage(mpx.transSubpackageRules, tarRoot)

          resolveResourcePathMap.set(name, resolveResourcePath)
          if (tarRoot) asyncComponents.push({ name, tarRoot, placeholder, relativePath })

          fillInComponentsMap(name, entry, tarRoot)
          callback()
        })
      }, (err) => {
        if (err) return callback(err)
        async.each(asyncComponents, ({ name, tarRoot, placeholder, relativePath }, callback) => {
          processAsyncSubpackageRules(jsonObj, context, { name, tarRoot, placeholder, relativePath, resolveResourcePathMap }, (err, placeholder) => {
            if (err) return callback(err)
            if (placeholder) {
              const { name, entry } = placeholder
              fillInComponentsMap(name, entry, '')
            }
            callback()
          })
        }, callback)
      })
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
