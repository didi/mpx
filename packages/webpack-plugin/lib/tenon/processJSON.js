const async = require('async')
const path = require('path')
const JSON5 = require('json5')
const loaderUtils = require('loader-utils')
const parseRequest = require('../utils/parse-request')
// const toPosix = require('../utils/to-posix')
const addQuery = require('../utils/add-query')
const parseComponent = require('../parser')
const getJSONContent = require('../utils/get-json-content')
const isUrlRequest = require('../utils/is-url-request')

module.exports = function (jsonContent, options, rawCallback) {
  const mode = options.mode
  const env = options.env
  const defs = options.defs
  const loaderContext = options.loaderContext
  const resolveMode = options.resolveMode
  // const pagesMap = options.pagesMap
  const componentsMap = options.componentsMap
  const projectRoot = options.projectRoot
  const pathHash = options.pathHash
  const localPagesMap = {}
  const localComponentsMap = {}
  const buildInfo = loaderContext._module.buildInfo

  const output = '/* json */\n'
  let jsonObj = {}
  let tabBarMap
  let tabBarStr
  const context = loaderContext.context

  // const emitWarning = (msg) => {
  //   loaderContext.emitWarning(
  //     new Error('[json processor][' + loaderContext.resource + ']: ' + msg)
  //   )
  // }

  // const emitError = (msg) => {
  //   this.emitError(
  //     new Error('[json compiler][' + this.resource + ']: ' + msg)
  //   )
  // }

  // const stringifyRequest = r => loaderUtils.stringifyRequest(loaderContext, r)

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
  // 由于json需要提前读取在template处理中使用，src的场景已经在loader中处理了，此处无需考虑json.src的场景
  try {
    jsonObj = JSON5.parse(jsonContent)
  } catch (e) {
    return callback(e)
  }

  const fs = loaderContext._compiler.inputFileSystem

  const resolve = (context, request, callback) => {
    // const { queryObj } = parseRequest(request)
    // todo delete. parseRequest 不会返回 context 属性
    // context = queryObj.context || context
    return loaderContext.resolve(context, request, callback)
  }

  // const defaultTabbar = {
  //   borderStyle: 'black',
  //   position: 'bottom',
  //   custom: false,
  //   isShow: true
  // }

  // const processTabBar = (tabBar, callback) => {
  //   if (tabBar) {
  //     tabBar = Object.assign({}, defaultTabbar, tabBar)
  //     tabBarMap = {}
  //     jsonObj.tabBar.list.forEach(({ pagePath }) => {
  //       tabBarMap[pagePath] = true
  //     })
  //     tabBarStr = JSON.stringify(tabBar)
  //     tabBarStr = tabBarStr.replace(/"(iconPath|selectedIconPath)":"([^"]+)"/g, function (matched, $1, $2) {
  //       if (isUrlRequest($2, projectRoot)) {
  //         return `"${$1}":require(${stringifyRequest(loaderUtils.urlToRequest($2, projectRoot))})`
  //       }
  //       return matched
  //     })
  //   }
  //   callback()
  // }

  const processPackages = (packages, context, callback) => {
    if (packages) {
      async.forEach(packages, (packagePath, callback) => {
        const parsed = parseRequest(packagePath)
        const queryObj = parsed.queryObj
        // readFile无法处理query
        packagePath = parsed.resourcePath
        async.waterfall([
          (callback) => {
            resolve(context, packagePath, (err, result) => {
              callback(err, result)
            })
          },
          (result, callback) => {
            loaderContext.addDependency(result)
            fs.readFile(result, (err, content) => {
              if (err) return callback(err)
              callback(err, result, content.toString('utf-8'))
            })
          },
          (result, content, callback) => {
            const filePath = result
            const extName = path.extname(filePath)
            if (extName === '.mpx' || extName === '.vue') {
              const parts = parseComponent(content, {
                filePath,
                needMap: loaderContext.sourceMap,
                mode,
                defs,
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
                processSelfQueue.push((callback) => {
                  processSubPackage(subPackage, context, callback)
                })
              } else {
                processSelfQueue.push((callback) => {
                  processPages(content.pages, '', '', context, callback)
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
        ], callback)
      }, callback)
    } else {
      callback()
    }
  }

  // const getPageName = (resourcePath, ext) => {
  //   const baseName = path.basename(resourcePath, ext)
  //   return path.join('pages', baseName + pathHash(resourcePath), baseName)
  // }

  const processPages = (pages, srcRoot = '', tarRoot = '', context, callback) => {
    if (pages) {
      context = path.join(context, srcRoot)
      async.forEach(pages, (page, callback) => {
        let pagePath = page
        if (typeof page !== 'string') {
          pagePath = page.src
        }
        // if (!isUrlRequest(page, projectRoot)) return callback()
        // if (resolveMode === 'native') {
        //   page = loaderUtils.urlToRequest(page, projectRoot)
        // }
        // resolve(context, page, (err, resource) => {
        //   if (err) return callback(err)
        //   const { resourcePath, queryObj } = parseRequest(resource)
        //   const ext = path.extname(resourcePath)
        //   // 获取pageName
        //   let pageName
        //   if (aliasPath) {
        //     pageName = toPosix(path.join(tarRoot, aliasPath))
        //     // 判断 key 存在重复情况直接报错
        //     for (let key in pagesMap) {
        //       if (pagesMap[key] === pageName && key !== resourcePath) {
        //         emitError(`Current page [${resourcePath}] registers a conflict page path [${pageName}] with existed page [${key}], which is not allowed, please rename it!`)
        //         return callback()
        //       }
        //     }
        //   } else {
        //     const relative = path.relative(context, resourcePath)
        //     if (/^\./.test(relative)) {
        //       // 如果当前page不存在于context中，对其进行重命名
        //       pageName = toPosix(path.join(tarRoot, getPageName(resourcePath, ext)))
        //       emitWarning(`Current page [${resourcePath}] is not in current pages directory [${context}], the page path will be replaced with [${pageName}], use ?resolve to get the page path and navigate to it!`)
        //     } else {
        //       pageName = toPosix(path.join(tarRoot, /^(.*?)(\.[^.]*)?$/.exec(relative)[1]))
        //       // 如果当前page与已有page存在命名冲突，也进行重命名
        //       for (let key in pagesMap) {
        //         // 此处引入pagesMap确保相同entry下路由路径重复注册才报错，不同entry下的路由路径重复则无影响
        //         if (pagesMap[key] === pageName && key !== resourcePath && pagesMap[key] === loaderContext.resourcePath) {
        //           const pageNameRaw = pageName
        //           pageName = toPosix(path.join(tarRoot, getPageName(resourcePath, ext)))
        //           emitWarning(`Current page [${resourcePath}] is registered with a conflict page path [${pageNameRaw}] which is already existed in system, the page path will be replaced with [${pageName}], use ?resolve to get the page path and navigate to it!`)
        //           break
        //         }
        //       }
        //     }
        //   }
        //   if (pagesMap[resourcePath]) {
        //     emitWarning(`Current page [${resourcePath}] which is imported from [${loaderContext.resourcePath}] has been registered in pagesMap already, it will be ignored, please check it and remove the redundant page declaration!`)
        //     return callback()
        //   }
        // buildInfo.pagesMap = buildInfo.pagesMap || {}
        // buildInfo.pagesMap[resourcePath] = pagesMap[resourcePath] = pageName
        // pagesMap[resourcePath] = loaderContext.resourcePath
        localPagesMap[pagePath] = page
        //   callback()
        // })
        callback()
      }, callback)
    } else {
      callback()
    }
  }

  const processSubPackage = (subPackage, context, callback) => {
    if (subPackage) {
      const tarRoot = subPackage.tarRoot || subPackage.root || ''
      const srcRoot = subPackage.srcRoot || subPackage.root || ''
      if (!tarRoot) return callback()
      processPages(subPackage.pages, srcRoot, tarRoot, context, callback)
    } else {
      callback()
    }
  }

  const processSubPackages = (subPackages, context, callback) => {
    if (subPackages) {
      async.forEach(subPackages, (subPackage, callback) => {
        processSubPackage(subPackage, context, callback)
      }, callback)
    } else {
      callback()
    }
  }

  const processComponents = (components, context, callback) => {
    if (components) {
      async.forEachOf(components, (component, name, callback) => {
        processComponent(component, name, context, callback)
      }, callback)
    } else {
      callback()
    }
  }

  const processComponent = (component, name, context, callback) => {
    if (!isUrlRequest(component, projectRoot)) return callback()

    if (resolveMode === 'native') {
      component = loaderUtils.urlToRequest(component, projectRoot)
    }

    resolve(context, component, (err, resource) => {
      if (err) return callback(err)
      const { resourcePath, queryObj } = parseRequest(resource)
      const parsed = path.parse(resourcePath)
      const componentId = parsed.name + pathHash(resourcePath)

      buildInfo.packageName = 'main'
      buildInfo.componentsMap = buildInfo.componentsMap || {}
      buildInfo.componentsMap[resourcePath] = componentsMap[resourcePath] = componentId

      localComponentsMap[name] = {
        resource: addQuery(resource, { isComponent: true, componentId }),
        async: queryObj.async
      }
      callback()
    })
  }

  // const processGenerics = (generics, context, callback) => {
  //   if (generics) {
  //     async.forEachOf(generics, (generic, name, callback) => {
  //       if (generic.default) {
  //         processComponent(generic.default, `${name}default`, context, callback)
  //       } else {
  //         callback()
  //       }
  //     }, callback)
  //   } else {
  //     callback()
  //   }
  // }

  async.parallel([
    (callback) => {
      if (jsonObj.pages && jsonObj.pages[0]) {
        // 标记首页
        if (typeof jsonObj.pages[0] !== 'string') {
          jsonObj.pages[0].src = addQuery(jsonObj.pages[0].src, { isFirst: true })
        } else {
          jsonObj.pages[0] = addQuery(jsonObj.pages[0], { isFirst: true })
        }
      }
      processPages(jsonObj.pages, '', '', context, callback)
    },
    (callback) => {
      processComponents(jsonObj.usingComponents, context, callback)
    },
    (callback) => {
      processPackages(jsonObj.packages, context, callback)
    },
    (callback) => {
      processSubPackages(jsonObj.subPackages || jsonObj.subpackages, context, callback)
    }
    // (callback) => {
    //   processGenerics(jsonObj.componentGenerics, context, callback)
    // },
    // (callback) => {
    //   processTabBar(jsonObj.tabBar, callback)
    // }
  ], callback)
}
