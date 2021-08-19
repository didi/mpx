const async = require('async')
const JSON5 = require('json5')
const path = require('path')
const EntryPlugin = require('webpack/lib/EntryPlugin')
const loaderUtils = require('loader-utils')
const parseComponent = require('../parser')
const config = require('../config')
const normalize = require('../utils/normalize')
const nativeLoaderPath = normalize.lib('native-loader')
const parseRequest = require('../utils/parse-request')
const mpxJSON = require('../utils/mpx-json')
const toPosix = require('../utils/to-posix')
const fixUsingComponent = require('../utils/fix-using-component')
const getRulesRunner = require('../platform/index')
const isUrlRequestRaw = require('../utils/is-url-request')
const addQuery = require('../utils/add-query')
const readJsonForSrc = require('../utils/read-json-for-src')
const getMainCompilation = require('../utils/get-main-compilation')
const createHelpers = require('../helpers')

module.exports = function (raw) {
  // 该loader中会在每次编译中动态添加entry，不能缓存，否则watch不好使
  this.cacheable(false)
  const nativeCallback = this.async()
  const mainCompilation = getMainCompilation(this._compilation)
  const moduleGraph = this._compilation.moduleGraph
  const mpx = this.getMpx()

  if (!mpx) {
    return nativeCallback(null, raw)
  }

  // 微信插件下要求组件使用相对路径
  const useRelativePath = mpx.isPluginMode || mpx.useRelativePath
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const packageName = queryObj.packageName || mpx.currentPackageRoot || 'main'
  const appsMap = mpx.appsMap
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const getEntryNode = mpx.getEntryNode
  const mode = mpx.mode
  const env = mpx.env
  const defs = mpx.defs
  const globalSrcMode = mpx.srcMode
  const localSrcMode = queryObj.mode
  const srcMode = localSrcMode || globalSrcMode
  const resolveMode = mpx.resolveMode
  const externals = mpx.externals
  const root = mpx.projectRoot
  const pathHash = mpx.pathHash
  const isApp = !(pagesMap[resourcePath] || componentsMap[resourcePath])
  const publicPath = this._compilation.outputOptions.publicPath || ''
  const fs = this._compiler.inputFileSystem

  const isUrlRequest = r => isUrlRequestRaw(r, root, externals)
  const urlToRequest = r => loaderUtils.urlToRequest(r)

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

  const { getRequestString } = createHelpers(this)

  const currentName = componentsMap[resourcePath] || pagesMap[resourcePath] || appsMap[resourcePath]
  if (!currentName) {
    emitError('No currentName!')
  }
  const currentPath = publicPath + currentName

  // json模块都是由.mpx或.js的入口模块引入，且引入关系为一对一，其issuer必为入口module
  const entryModule = moduleGraph.getIssuer(this._module)
  // 通过rawRequest关联entryNode和entryModule
  const entryRequest = entryModule.rawRequest
  const entryType = isApp ? 'App' : pagesMap[resourcePath] ? 'Page' : 'Component'

  const currentEntry = getEntryNode(entryRequest, entryType, entryModule)

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
    const dep = EntryPlugin.createDependency(resource, { name })
    entryDeps.add(dep)
    this._compilation.addEntry(this._compiler.context, dep, { name }, (err, module) => {
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
      json = JSON5.parse(raw || '{}')
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
    // todo 迁移到rulesRunner中进行
    fixUsingComponent(json.usingComponents, mode, emitWarning)
  }

  // 快应用补全json配置，必填项
  if (mode === 'qa' && isApp) {
    const defaultConf = {
      package: '',
      name: '',
      icon: 'assets/images/logo.png',
      versionName: '',
      versionCode: 1,
      minPlatformVersion: 1080
    }
    json = Object.assign({}, defaultConf, json)
  }

  const rulesRunnerOptions = {
    mode,
    mpx,
    srcMode,
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

  const processComponents = (components, context, callback) => {
    if (components) {
      async.forEachOf(components, (component, name, callback) => {
        processComponent(component, context, (componentPath) => {
          if (useRelativePath === true) {
            componentPath = toPosix(path.relative(path.dirname(currentPath), componentPath))
          }
          components[name] = componentPath
        }, undefined, callback)
      }, callback)
    } else {
      callback()
    }
  }

  const processComponent = (component, context, rewritePath, outputPath, callback) => {
    if (!isUrlRequest(component)) return callback()
    if (resolveMode === 'native') {
      component = urlToRequest(component)
    }

    resolve(context, component, (err, resource, info) => {
      if (err) return callback(err)
      const resourcePath = parseRequest(resource).resourcePath
      const parsed = path.parse(resourcePath)
      const ext = parsed.ext
      const resourceName = path.join(parsed.dir, parsed.name)

      if (!outputPath) {
        if (ext === '.js' && resourceName.includes('node_modules')) {
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
      const packageInfo = mpx.getPackageInfo({
        resource,
        outputPath,
        resourceType: 'components',
        warn: (err) => {
          this.emitWarning(err)
        }
      })
      // 此处query为了实现消除分包间模块缓存，以实现不同分包中引用的组件在不同分包中都能输出
      resource = addQuery(resource, {
        packageName: packageInfo.packageName
      })
      const componentPath = packageInfo.outputPath
      rewritePath && rewritePath(publicPath + componentPath)
      if (ext === '.js') {
        resource = '!!' + nativeLoaderPath + '!' + resource
      }
      currentEntry.addChild(getEntryNode(resource, 'Component'))
      // 如果之前已经创建了入口，直接return
      if (packageInfo.alreadyOutputed) {
        return callback()
      }
      addEntrySafely(resource, componentPath, callback)
    })
  }

  // 由于json模块都是由mpx/js文件引入的，需要向上找两层issuer获取真实的引用源
  const getJsonIssuer = (module) => {
    const issuer = moduleGraph.getIssuer(module)
    if (issuer) {
      return moduleGraph.getIssuer(issuer)
    }
  }

  if (isApp) {

  }

  if (isApp) {
    if (!mpx.appInfo) {
      for (const [name, { dependencies }] of mainCompilation.entries) {
        if (moduleGraph.getModule(dependencies[0]) === this._module) {
          mpx.appInfo = {
            name,
            resourcePath
          }
          break
        }
      }
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
      if (typeof json.pages[0] !== 'string') {
        json.pages[0].src = addQuery(json.pages[0].src, { isFirst: true })
      } else {
        json.pages[0] = addQuery(json.pages[0], { isFirst: true })
      }
    }

    const processPackages = (packages, context, callback) => {
      if (packages) {
        async.forEach(packages, (packagePath, callback) => {
          const { queryObj } = parseRequest(packagePath)
          async.waterfall([
            (callback) => {
              resolve(context, packagePath, (err, result) => {
                const { rawResourcePath } = parseRequest(result)
                callback(err, rawResourcePath)
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
              const extName = path.extname(result)
              if (extName === '.mpx' || extName === '.vue') {
                const parts = parseComponent(content, {
                  filePath: result,
                  needMap: this.sourceMap,
                  mode,
                  defs,
                  env
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

    const getOtherConfig = (config) => {
      let result = {}
      let blackListMap = {
        tarRoot: true,
        srcRoot: true,
        root: true,
        pages: true
      }
      for (let key in config) {
        if (!blackListMap[key]) {
          result[key] = config[key]
        }
      }
      return result
    }

    // 为了获取资源的所属子包，该函数需串行执行
    const processSubPackage = (subPackage, context, callback) => {
      if (subPackage) {
        if (typeof subPackage.root === 'string' && subPackage.root.startsWith('.')) {
          emitError(`Current subpackage root [${subPackage.root}] is not allow starts with '.'`)
          return callback()
        }
        let tarRoot = subPackage.tarRoot || subPackage.root || ''
        let srcRoot = subPackage.srcRoot || subPackage.root || ''
        if (!tarRoot || subPackagesCfg[tarRoot]) return callback()

        const otherConfig = getOtherConfig(subPackage)
        // 支付宝不支持独立分包，无需处理
        if (otherConfig.independent && mode !== 'ali') {
          mpx.independentSubpackagesMap[tarRoot] = true
        }

        subPackagesCfg[tarRoot] = {
          root: tarRoot,
          pages: [],
          ...otherConfig
        }
        mpx.currentPackageRoot = tarRoot
        mpx.componentsMap[tarRoot] = {}
        mpx.staticResourcesMap[tarRoot] = {}
        mpx.subpackageModulesMap[tarRoot] = {}
        async.parallel([
          (callback) => {
            processPages(subPackage.pages, srcRoot, tarRoot, context, callback)
          },
          (callback) => {
            processPlugins(subPackage.plugins, srcRoot, tarRoot, context, callback)
          }
        ], callback)
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
          let aliasPath = ''
          if (typeof page !== 'string') {
            aliasPath = page.path
            page = page.src
          }
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
            if (aliasPath) {
              pageName = toPosix(path.join(tarRoot, aliasPath))
              // 判断 key 存在重复情况直接报错
              for (let key in pagesMap) {
                if (pagesMap[key] === pageName && key !== resourcePath) {
                  emitError(`Current page [${resourcePath}] registers a conflict page path [${pageName}] with existed page [${key}], which is not allowed, please rename it!`)
                  return callback()
                }
              }
            } else {
              const relative = path.relative(context, resourcePath)
              if (/^\./.test(relative)) {
                // 如果当前page不存在于context中，对其进行重命名
                pageName = toPosix(path.join(tarRoot, getPageName(resourcePath, ext)))
                emitWarning(`Current page [${resourcePath}] is not in current pages directory [${context}], the page path will be replaced with [${pageName}], use ?resolve to get the page path and navigate to it!`)
              } else {
                pageName = toPosix(path.join(tarRoot, /^(.*?)(\.[^.]*)?$/.exec(relative)[1]))
                // 如果当前page与已有page存在命名冲突，也进行重命名
                for (let key in pagesMap) {
                  if (pagesMap[key] === pageName && key !== resourcePath) {
                    const pageNameRaw = pageName
                    pageName = toPosix(path.join(tarRoot, getPageName(resourcePath, ext)))
                    emitWarning(`Current page [${resourcePath}] is registered with a conflict page path [${pageNameRaw}] which is already existed in system, the page path will be replaced with [${pageName}], use ?resolve to get the page path and navigate to it!`)
                    break
                  }
                }
              }
            }
            if (ext === '.js') {
              resource = '!!' + nativeLoaderPath + '!' + resource
            }
            // 如果之前已经创建了页面入口，直接return，目前暂时不支持多个分包复用同一个页面
            if (pagesMap[resourcePath]) {
              emitWarning(`Current page [${resourcePath}] which is imported from [${this.resourcePath}] has been registered in pagesMap already, it will be ignored, please check it and remove the redundant page declaration!`)
              return callback()
            }
            currentEntry.addChild(getEntryNode(resource, 'Page'))
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
        const requestString = getRequestString('json', { src: urlToRequest(json.themeLocation) }, {
          isTheme: true,
          isStatic: true
        })
        output += `json.themeLocation = require(${requestString});\n`
      }
      return output
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

    const addMiniToPluginModules = module => {
      if (mpx.miniToPluginModules) {
        mpx.miniToPluginModules.add(module)
      } else {
        mpx.miniToPluginModules = new Set([module])
      }
    }

    const processPluginGenericsImplementation = (genericsImplementation, tarRoot, context, callback) => {
      async.forEachOf(genericsImplementation, (genericComponents, name, callback) => {
        async.forEachOf(genericComponents, (genericComponentPath, name, callback) => {
          processComponent(genericComponentPath, context, (componentPath) => {
            if (useRelativePath === true) {
              componentPath = toPosix(path.relative(publicPath + tarRoot, componentPath))
            }
            genericComponents[name] = componentPath
          }, undefined, callback)
        }, callback)
      }, callback)
    }

    const processPluginExport = (plugin, tarRoot, context, callback) => {
      if (!plugin.export) {
        return callback()
      }
      let pluginExport = plugin.export
      if (resolveMode === 'native') {
        pluginExport = urlToRequest(pluginExport)
      }
      resolve(context, pluginExport, (err, resource, info) => {
        if (err) return callback(err)
        const { resourcePath } = parseRequest(resource)
        // 获取 export 的模块名
        const relative = path.relative(context, resourcePath)
        const name = toPosix(/^(.*?)(\.[^.]*)?$/.exec(relative)[1])
        if (/^\./.test(name)) {
          return callback(new Error(`The miniprogram plugins' export path ${plugin.export} must be in the context ${context}!`))
        }
        plugin.export = name + '.js'
        addEntrySafely(resource, toPosix(tarRoot ? `${tarRoot}/${name}` : name), (err, module) => {
          if (err) return callback(err)
          addMiniToPluginModules(module)
          currentEntry.addChild(getEntryNode(resource, 'PluginExport', module))
          callback(err, module)
        })
      })
    }

    /* 导出到插件 */
    const processPlugins = (plugins, srcRoot = '', tarRoot = '', context, callback) => {
      if (mpx.mode !== 'wx' || !plugins) return callback() // 目前只有微信支持导出到插件
      context = path.join(context, srcRoot)
      async.forEachOf(plugins, (plugin, name, callback) => {
        async.parallel([
          (callback) => {
            if (plugin.genericsImplementation) {
              processPluginGenericsImplementation(plugin.genericsImplementation, tarRoot, context, callback)
            } else {
              callback()
            }
          },
          (callback) => {
            processPluginExport(plugin, tarRoot, context, callback)
          }
        ], (err) => {
          callback(err)
        })
      }, callback)
    }

    // 串行处理，先处理主包代码，再处理分包代码，为了正确识别出分包中定义的组件属于主包还是分包
    let errors = []
    // 外部收集errors，确保整个series流程能够执行完
    async.series([
      (callback) => {
        async.parallel([
          (callback) => {
            processPlugins(json.plugins, '', '', this.context, callback)
          },
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
        if (mpx.appScriptPromise) {
          mpx.appScriptPromise.then(callback)
        } else {
          callback()
        }
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
    const processGenerics = (generics, context, callback) => {
      if (generics) {
        async.forEachOf(generics, (generic, name, callback) => {
          if (generic.default) {
            processComponent(generic.default, context, (componentPath) => {
              if (useRelativePath === true) {
                componentPath = toPosix(path.relative(path.dirname(currentPath), componentPath))
              }
              generic.default = componentPath
            }, undefined, callback)
          } else {
            callback()
          }
        }, callback)
      } else {
        callback()
      }
    }
    // page.json或component.json
    async.parallel([
      (callback) => {
        processComponents(json.usingComponents, this.context, callback)
      },
      (callback) => {
        processGenerics(json.componentGenerics, this.context, callback)
      }
    ], (err) => {
      callback(err)
    })
  }
}
