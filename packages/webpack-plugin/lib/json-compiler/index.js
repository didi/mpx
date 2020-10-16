const async = require('async')
const JSON5 = require('json5')
const path = require('path')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const loaderUtils = require('loader-utils')
const parseComponent = require('../parser')
const config = require('../config')
const normalize = require('../utils/normalize')
const nativeLoaderPath = normalize.lib('native-loader')
const themeLoaderPath = normalize.lib('json-compiler/theme-loader')
const extractorPath = normalize.lib('extractor')
const parseRequest = require('../utils/parse-request')
const mpxJSON = require('../utils/mpx-json')
const toPosix = require('../utils/to-posix')
const fixUsingComponent = require('../utils/fix-using-component')
const getRulesRunner = require('../platform/index')
const isUrlRequestRaw = require('../utils/is-url-request')
const addQuery = require('../utils/add-query')
const readJsonForSrc = require('../utils/read-json-for-src')
const getMainCompilation = require('../utils/get-main-compilation')

module.exports = function (raw = '{}') {
  // 该loader中会在每次编译中动态添加entry，不能缓存，否则watch不好使
  this.cacheable(false)
  const nativeCallback = this.async()
  const options = loaderUtils.getOptions(this) || {}
  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__

  const emitWarning = (msg) => {
    this.emitWarning(
      new Error('[json compiler][' + this.resource + ']: ' + msg)
    )
  }

  const emitError = (msg) => {
    this.emitError(
      new Error('[json compiler][' + this.resource + ']: ' + msg)
    )
  }

  const stringifyRequest = r => loaderUtils.stringifyRequest(this, r)
  const isUrlRequest = r => isUrlRequestRaw(r, options.root)
  const urlToRequest = r => loaderUtils.urlToRequest(r, options.root)

  if (!mpx) {
    return nativeCallback(null, raw)
  }
  const packageName = mpx.currentPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const EntryNode = mpx.EntryNode
  const entryNodesMap = mpx.entryNodesMap
  const entryModulesMap = mpx.entryModulesMap
  const mode = mpx.mode
  const defs = mpx.defs
  const globalSrcMode = mpx.srcMode
  const localSrcMode = loaderUtils.parseQuery(this.resourceQuery || '?').mode
  const resolveMode = mpx.resolveMode
  const externals = mpx.externals
  const pathHash = mpx.pathHash
  const resourcePath = parseRequest(this.resource).resourcePath
  const isApp = !(pagesMap[resourcePath] || componentsMap[resourcePath])
  const publicPath = this._compilation.outputOptions.publicPath || ''
  const fs = this._compiler.inputFileSystem

  // json模块都是由.mpx或.js的入口模块引入，且引入关系为一对一，其issuer必为入口module
  const entryModule = this._module.issuer
  // 通过rawRequest关联entryNode和entryModule
  const entryRequest = entryModule.rawRequest
  const entryType = isApp ? 'App' : pagesMap[resourcePath] ? 'Page' : 'Component'

  function getEntryNode (request, type) {
    if (!entryNodesMap[request]) {
      entryNodesMap[request] = new EntryNode({
        type,
        request
      })
    } else if (entryNodesMap[request].type !== type) {
      emitError(`获取request为${request}的entryNode时类型与已有节点冲突, 当前获取的type为${type}, 已有节点的type为${entryNodesMap[request].type}!`)
    }
    return entryNodesMap[request]
  }

  const currentEntry = getEntryNode(entryRequest, entryType)
  currentEntry.module = entryModule
  entryModulesMap.set(entryModule, currentEntry)

  const copydir = (dir, context, callback) => {
    fs.readdir(dir, (err, files) => {
      if (err) return callback(err)
      async.forEach(files, (file, callback) => {
        file = path.join(dir, file)
        async.waterfall([
          (callback) => {
            fs.stat(file, callback)
          },
          (stats, callback) => {
            if (stats.isDirectory()) {
              copydir(file, context, callback)
            } else {
              fs.readFile(file, (err, content) => {
                if (err) return callback(err)
                let targetPath = path.relative(context, file)
                this._compilation.assets[targetPath] = {
                  size: function size () {
                    return stats.size
                  },
                  source: function source () {
                    return content
                  }
                }
                callback()
              })
            }
          }
        ], callback)
      }, callback)
    })
  }

  let entryDeps = new Set()

  let cacheCallback

  const checkEntryDeps = (callback) => {
    callback = callback || cacheCallback
    if (callback && entryDeps.size === 0) {
      callback()
    } else {
      cacheCallback = callback
    }
  }

  const addEntrySafely = (resource, name, callback) => {
    // 如果loader已经回调，就不再添加entry
    if (callbacked) return callback()
    const dep = SingleEntryPlugin.createDependency(resource, name)
    entryDeps.add(dep)
    this._compilation.addEntry(this._compiler.context, dep, name, (err, module) => {
      entryDeps.delete(dep)
      checkEntryDeps()
      callback(err, module)
    })
  }

  // const deleteEntry = (name) => {
  //   const index = this._compilation._preparedEntrypoints.findIndex(slot => slot.name === name)
  //   if (index >= 0) {
  //     this._compilation._preparedEntrypoints.splice(index, 1)
  //   }
  // }

  let callbacked = false
  const callback = (err, processOutput) => {
    checkEntryDeps(() => {
      callbacked = true
      if (err) return nativeCallback(err)
      let output = `var json = ${JSON.stringify(json, null, 2)};\n`
      if (processOutput) output = processOutput(output)
      output += `module.exports = JSON.stringify(json, null, 2);\n`
      nativeCallback(null, output)
    })
  }

  let json = {}
  try {
    // 使用了MPXJSON的话先编译
    // 此处需要使用真实的resourcePath
    if (this.resourcePath.endsWith('.json.js')) {
      json = JSON.parse(mpxJSON.compileMPXJSONText({ source: raw, defs, filePath: this.resourcePath }))
    } else {
      json = JSON5.parse(raw)
    }
  } catch (err) {
    return callback(err)
  }

  // json补全
  if (pagesMap[resourcePath]) {
    // page
    if (!mpx.forceUsePageCtor) {
      if (!json.usingComponents) {
        json.usingComponents = {}
      }
      if (!json.component && mode === 'swan') {
        json.component = true
      }
    }
  } else if (componentsMap[resourcePath]) {
    // component
    if (json.component !== true) {
      json.component = true
    }
  }

  if (json.usingComponents) {
    fixUsingComponent(json.usingComponents, mode, emitWarning)
  }

  const rulesRunnerOptions = {
    mode,
    mpx,
    srcMode: localSrcMode || globalSrcMode,
    type: 'json',
    waterfall: true,
    warn: emitWarning,
    error: emitError
  }
  if (!isApp) {
    rulesRunnerOptions.mainKey = pagesMap[resourcePath] ? 'page' : 'component'
    // polyfill global usingComponents
    // todo 传入rulesRunner中进行按平台转换
    rulesRunnerOptions.data = {
      globalComponents: mpx.usingComponents
    }
  } else {
    // 保存全局注册组件
    if (json.usingComponents) {
      mpx.usingComponents = {}
      Object.keys(json.usingComponents).forEach((key) => {
        const request = json.usingComponents[key]
        mpx.usingComponents[key] = addQuery(request, {
          context: this.context
        })
      })
    }
  }

  const rulesRunner = getRulesRunner(rulesRunnerOptions)

  if (rulesRunner) {
    rulesRunner(json)
  }

  const resolve = (context, request, callback) => {
    const { queryObj } = parseRequest(request)
    context = queryObj.context || context
    return this.resolve(context, request, callback)
  }

  const processComponent = (component, context, rewritePath, outputPath, callback) => {
    if (!isUrlRequest(component)) return callback()
    if (resolveMode === 'native') {
      component = urlToRequest(component)
    }

    if (externals.some((external) => {
      if (typeof external === 'string') {
        return external === component
      } else if (external instanceof RegExp) {
        return external.test(component)
      }
      return false
    })) {
      return callback()
    }

    resolve(context, component, (err, resource, info) => {
      if (err) return callback(err)
      const resourcePath = parseRequest(resource).resourcePath
      const parsed = path.parse(resourcePath)
      const ext = parsed.ext
      const resourceName = path.join(parsed.dir, parsed.name)

      if (!outputPath) {
        if (ext === '.js') {
          let root = info.descriptionFileRoot
          let name = 'nativeComponent'
          if (info.descriptionFileData) {
            if (info.descriptionFileData.miniprogram) {
              root = path.join(root, info.descriptionFileData.miniprogram)
            }
            if (info.descriptionFileData.name) {
              // 去掉name里面的@符号，因为支付宝不支持文件路径上有@
              name = info.descriptionFileData.name.split('@').join('')
            }
          }
          let relativePath = path.relative(root, resourceName)
          outputPath = path.join('components', name + pathHash(root), relativePath)
        } else {
          let componentName = parsed.name
          outputPath = path.join('components', componentName + pathHash(resourcePath), componentName)
        }
      }
      const packageInfo = mpx.getPackageInfo(resource, {
        outputPath,
        isStatic: false,
        error: (err) => {
          this.emitError(err)
        },
        warn: (err) => {
          this.emitWarning(err)
        }
      })
      const componentPath = packageInfo.outputPath
      rewritePath && rewritePath(publicPath + componentPath)
      if (ext === '.js') {
        resource = '!!' + nativeLoaderPath + '!' + resource
      }
      // 此处query为了实现消除分包间模块缓存，以实现不同分包中引用的组件在不同分包中都能输出
      resource = addQuery(resource, {
        packageName: packageInfo.packageName
      })
      currentEntry.addChild(getEntryNode(resource, 'Component'))
      // 如果之前已经创建了入口，直接return
      if (packageInfo.alreadyOutputed) {
        return callback()
      }
      addEntrySafely(resource, componentPath, callback)
    })
  }

  // 由于json模块都是由mpx/js文件引入的，需要向上找两层issuer获取真实的引用源
  function getJsonIssuer (module) {
    if (module.issuer) {
      return module.issuer.issuer
    }
  }

  if (isApp) {
    if (!mpx.hasApp) {
      mpx.hasApp = true
    } else {
      const issuer = getJsonIssuer(this._module)
      if (issuer) {
        emitError(`[json compiler]:Mpx单次构建中只能存在一个App，当前组件/页面[${this.resource}]通过[${issuer.resource}]非法引入，引用的资源将被忽略，请确保组件/页面资源通过usingComponents/pages配置引入！`)
      } else {
        emitError(`[json compiler]:Mpx单次构建中只能存在一个App，请检查当前entry中的资源[${this.resource}]是否为组件/页面，通过添加?component/page查询字符串显式声明该资源是组件/页面！`)
      }
      return callback()
    }
    // app.json
    const subPackagesCfg = {}
    const localPages = []
    const processSubPackagesQueue = []
    // 添加首页标识
    if (json.pages && json.pages[0]) {
      json.pages[0] = addQuery(json.pages[0], { isFirst: true })
    }

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
              this.addDependency(result)
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
                  needMap: this.sourceMap,
                  mode,
                  defs
                })
                const json = parts.json || {}
                if (json.content) {
                  content = json.content
                } else if (json.src) {
                  return readJsonForSrc(json.src, this, (content) => {
                    callback(null, result, content)
                  })
                }
              }
              callback(null, result, content)
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

                  processSubPackagesQueue.push((callback) => {
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

    const getOtherConfig = (raw) => {
      let result = {}
      let blackListMap = {
        tarRoot: true,
        srcRoot: true,
        root: true,
        pages: true
      }
      for (let key in raw) {
        if (!blackListMap[key]) {
          result[key] = raw[key]
        }
      }
      return result
    }

    // 为了获取资源的所属子包，该函数需串行执行
    const processSubPackage = (subPackage, context, callback) => {
      if (subPackage) {
        let tarRoot = subPackage.tarRoot || subPackage.root || ''
        let srcRoot = subPackage.srcRoot || subPackage.root || ''
        if (!tarRoot || subPackagesCfg[tarRoot]) return callback()

        subPackagesCfg[tarRoot] = {
          root: tarRoot,
          pages: [],
          ...getOtherConfig(subPackage)
        }
        mpx.currentPackageRoot = tarRoot
        mpx.componentsMap[tarRoot] = {}
        mpx.staticResourceMap[tarRoot] = {}
        processPages(subPackage.pages, srcRoot, tarRoot, context, callback)
      } else {
        callback()
      }
    }

    const processSubPackages = (subPackages, context, callback) => {
      if (subPackages) {
        subPackages.forEach((subPackage) => {
          processSubPackagesQueue.push((callback) => {
            processSubPackage(subPackage, context, callback)
          })
        })
      }
      callback()
    }

    const getPageName = (resourcePath, ext) => {
      const baseName = path.basename(resourcePath, ext)
      return path.join('pages', baseName + pathHash(resourcePath), baseName)
    }

    const processPages = (pages, srcRoot = '', tarRoot = '', context, callback) => {
      if (pages) {
        context = path.join(context, srcRoot)
        async.forEach(pages, (page, callback) => {
          if (!isUrlRequest(page)) return callback()
          if (resolveMode === 'native') {
            page = urlToRequest(page)
          }
          resolve(context, page, (err, resource) => {
            if (err) return callback(err)
            const { resourcePath, queryObj } = parseRequest(resource)
            const ext = path.extname(resourcePath)
            // 获取pageName
            let pageName
            const relative = path.relative(context, resourcePath)
            if (/^\./.test(relative)) {
              // 如果当前page不存在于context中，对其进行重命名
              pageName = toPosix(path.join(tarRoot, getPageName(resourcePath, ext)))
              emitWarning(`Current page ${resourcePath} is not in current pages directory ${context}, the page path will be replaced with ${pageName}, use ?resolve to get the page path and navigate to it!`)
            } else {
              pageName = toPosix(path.join(tarRoot, /^(.*?)(\.[^.]*)?$/.exec(relative)[1]))
              // 如果当前page与已有page存在命名冲突，也进行重命名
              for (let key in pagesMap) {
                if (pagesMap[key] === pageName && key !== resourcePath) {
                  const pageNameRaw = pageName
                  pageName = toPosix(path.join(tarRoot, getPageName(resourcePath, ext)))
                  emitWarning(`Current page ${resourcePath} is registered with a conflict page path ${pageNameRaw} which is already existed in system, the page path will be replaced with ${pageName}, use ?resolve to get the page path and navigate to it!`)
                  break
                }
              }
            }
            if (ext === '.js') {
              resource = '!!' + nativeLoaderPath + '!' + resource
            }
            currentEntry.addChild(getEntryNode(resource, 'Page'))
            // 如果之前已经创建了页面入口，直接return，目前暂时不支持多个分包复用同一个页面
            if (pagesMap[resourcePath]) return callback()
            pagesMap[resourcePath] = pageName
            if (tarRoot && subPackagesCfg[tarRoot]) {
              subPackagesCfg[tarRoot].pages.push(toPosix(path.relative(tarRoot, pageName)))
            } else {
              // 确保首页
              if (queryObj.isFirst) {
                localPages.unshift(pageName)
              } else {
                localPages.push(pageName)
              }
            }
            addEntrySafely(resource, pageName, callback)
          })
        }, callback)
      } else {
        callback()
      }
    }

    const processTabBar = (output) => {
      let tabBarCfg = config[mode].tabBar
      let itemKey = tabBarCfg.itemKey
      let iconKey = tabBarCfg.iconKey
      let activeIconKey = tabBarCfg.activeIconKey

      if (json.tabBar && json.tabBar[itemKey]) {
        json.tabBar[itemKey].forEach((item, index) => {
          if (item[iconKey] && isUrlRequest(item[iconKey])) {
            output += `json.tabBar.${itemKey}[${index}].${iconKey} = require("${addQuery(urlToRequest(item[iconKey]), { useLocal: true })}");\n`
          }
          if (item[activeIconKey] && isUrlRequest(item[activeIconKey])) {
            output += `json.tabBar.${itemKey}[${index}].${activeIconKey} = require("${addQuery(urlToRequest(item[activeIconKey]), { useLocal: true })}");\n`
          }
        })
      }
      return output
    }

    const processOptionMenu = (output) => {
      let optionMenuCfg = config[mode].optionMenu
      if (optionMenuCfg && json.optionMenu) {
        let iconKey = optionMenuCfg.iconKey
        if (json.optionMenu[iconKey] && isUrlRequest(json.optionMenu[iconKey])) {
          output += `json.optionMenu.${iconKey} = require("${addQuery(urlToRequest(json.optionMenu[iconKey]), { useLocal: true })}");\n`
        }
      }
      return output
    }

    const processThemeLocation = (output) => {
      if (json.themeLocation && isUrlRequest(json.themeLocation)) {
        const themeRequest = '!!' + extractorPath + '?' +
          JSON.stringify({
            type: 'json',
            index: -1
          }) + '!' +
          themeLoaderPath + '?root = ' + options.root + '!' +
          addQuery(urlToRequest(json.themeLocation), { __component: true })

        output += `json.themeLocation = require(${stringifyRequest(themeRequest)});\n`
      }
      return output
    }

    const processComponents = (components, context, callback) => {
      if (components) {
        async.forEachOf(components, (component, name, callback) => {
          processComponent(component, context, (path) => {
            json.usingComponents[name] = path
          }, undefined, callback)
        }, callback)
      } else {
        callback()
      }
    }

    const processWorkers = (workers, context, callback) => {
      if (workers) {
        let workersPath = path.join(context, workers)
        this.addContextDependency(workersPath)
        copydir(workersPath, context, callback)
      } else {
        callback()
      }
    }

    const processCustomTabBar = (tabBar, context, callback) => {
      if (tabBar && tabBar.custom) {
        processComponent('./custom-tab-bar/index', context, undefined, 'custom-tab-bar/index', callback)
      } else {
        callback()
      }
    }

    // 串行处理，先处理主包代码，再处理分包代码，为了正确识别出分包中定义的组件属于主包还是分包
    let errors = []
    // 外部收集errors，确保整个series流程能够执行完
    async.series([
      (callback) => {
        async.parallel([
          (callback) => {
            processPages(json.pages, '', '', this.context, callback)
          },
          (callback) => {
            processComponents(json.usingComponents, this.context, callback)
          },
          (callback) => {
            processWorkers(json.workers, this.context, callback)
          },
          (callback) => {
            processPackages(json.packages, this.context, callback)
          },
          (callback) => {
            processCustomTabBar(json.tabBar, this.context, callback)
          },
          (callback) => {
            processSubPackages(json.subPackages || json.subpackages, this.context, callback)
          }
        ], (err) => {
          if (err) {
            errors.push(err)
          }
          callback()
        })
      },
      (callback) => {
        async.series(processSubPackagesQueue, (err) => {
          if (err) {
            errors.push(err)
          }
          // 处理完分包后重置currentPackageRoot以确保app中的资源输出到主包
          mpx.currentPackageRoot = ''
          callback()
        })
      }
    ], () => {
      if (errors.length) return callback(errors[0])
      delete json.packages
      delete json.subpackages
      delete json.subPackages
      json.pages = localPages
      for (let root in subPackagesCfg) {
        if (!json.subPackages) {
          json.subPackages = []
        }
        json.subPackages.push(subPackagesCfg[root])
      }
      const processOutput = (output) => {
        output = processTabBar(output)
        output = processOptionMenu(output)
        output = processThemeLocation(output)
        return output
      }
      callback(null, processOutput)
    })
  } else {
    // page.json或component.json
    if (json.usingComponents) {
      async.forEachOf(json.usingComponents, (component, name, callback) => {
        processComponent(component, this.context, (path) => {
          json.usingComponents[name] = path
        }, undefined, callback)
      }, callback)
    } else if (json.componentGenerics) {
      // 处理抽象节点
      async.forEachOf(json.componentGenerics, (genericCfg, name, callback) => {
        if (genericCfg && genericCfg.default) {
          processComponent(genericCfg.default, this.context, (path) => {
            json.componentGenerics[name].default = path
          }, undefined, callback)
        } else {
          callback()
        }
      }, callback)
    } else {
      callback()
    }
  }
}
