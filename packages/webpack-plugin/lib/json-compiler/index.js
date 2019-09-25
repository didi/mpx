const async = require('async')
const path = require('path')
const hash = require('hash-sum')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const loaderUtils = require('loader-utils')
const parse = require('../parser')
const config = require('../config')
const normalize = require('../utils/normalize')
const nativeLoaderPath = normalize.lib('native-loader')
const getResourcePath = require('../utils/get-resource-path')
const mpxJSON = require('../utils/mpx-json')
const toPosix = require('../utils/to-posix')
const getRulesRunner = require('../platform/index')
const isUrlRequest = require('../utils/is-url-request')
const getPageName = require('../utils/get-page-name')
const addQuery = require('../utils/add-query')

module.exports = function (raw) {
  // 该loader中会在每次编译中动态添加entry，不能缓存，否则watch不好使
  this.cacheable(false)
  const nativeCallback = this.async()
  const options = loaderUtils.getOptions(this) || {}
  const mpx = this._compilation.__mpx__

  if (!mpx) {
    return nativeCallback(null, raw)
  }
  const packageName = mpx.processingSubPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap
  const resourceMap = mpx.resourceMap
  const currentComponentsMap = componentsMap[packageName]
  const mode = mpx.mode
  const globalSrcMode = mpx.srcMode
  const localSrcMode = loaderUtils.parseQuery(this.resourceQuery || '?').mode
  const resolveMode = mpx.resolveMode
  const resourcePath = getResourcePath(this.resource)
  const isApp = !(pagesMap[resourcePath] || currentComponentsMap[resourcePath])
  const publicPath = this._compilation.outputOptions.publicPath || ''
  const fs = this._compiler.inputFileSystem

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

  let json
  try {
    // 使用了MPXJSON的话先编译
    // 此处需要使用真实的resourcePath
    if (this.resourcePath.endsWith('.json.js')) {
      json = JSON.parse(mpxJSON.compileMPXJSONText({ source: raw, mode, filePath: this.resourcePath }))
    } else {
      json = JSON.parse(raw)
    }
  } catch (err) {
    return callback(err)
  }

  const rulesRunnerOptions = {
    mode,
    srcMode: localSrcMode || globalSrcMode,
    type: 'json',
    waterfall: true,
    warn: (msg) => {
      this.emitWarning(
        new Error('[json compiler][' + this.resource + ']: ' + msg)
      )
    },
    error: (msg) => {
      this.emitError(
        new Error('[json compiler][' + this.resource + ']: ' + msg)
      )
    }
  }
  if (!isApp) {
    rulesRunnerOptions.mainKey = pagesMap[resourcePath] ? 'page' : 'component'
  }

  const rulesRunner = getRulesRunner(rulesRunnerOptions)

  if (rulesRunner) {
    rulesRunner(json)
  }

  const processComponent = (component, context, rewritePath, componentPath, callback) => {
    if (/^plugin:\/\//.test(component)) {
      return callback()
    }

    const packageName = mpx.processingSubPackageRoot || 'main'
    const currentComponentsMap = componentsMap[packageName]

    if (resolveMode === 'native') {
      component = loaderUtils.urlToRequest(component, options.root)
    }

    this.resolve(context, component, (err, resource, info) => {
      if (err) return callback(err)
      const resourcePath = getResourcePath(resource)
      const parsed = path.parse(resourcePath)
      const ext = parsed.ext
      const resourceName = path.join(parsed.dir, parsed.name)
      let subPackageRoot = ''
      if (mpx.processingSubPackageRoot) {
        if (!componentsMap.main[resourcePath]) {
          subPackageRoot = mpx.processingSubPackageRoot
        } else {
          currentComponentsMap[resourcePath] = componentsMap.main[resourcePath]
        }
      }
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
        componentPath = componentPath || path.join(subPackageRoot, 'components', name + hash(root), relativePath)
      } else {
        let componentName = parsed.name
        componentPath = componentPath || path.join(subPackageRoot, 'components', componentName + hash(resourcePath), componentName)
      }
      componentPath = toPosix(componentPath)
      rewritePath && rewritePath(publicPath + componentPath)
      // 如果之前已经创建了入口，rewritePath后直接return
      if (currentComponentsMap[resourcePath]) {
        rewritePath && rewritePath(publicPath + currentComponentsMap[resourcePath])
        return callback()
      }
      currentComponentsMap[resourcePath] = componentPath
      if (ext === '.js') {
        const nativeLoaderOptions = mpx.loaderOptions ? '?' + JSON.stringify(mpx.loaderOptions) : ''
        resource = '!!' + nativeLoaderPath + nativeLoaderOptions + '!' + resource
      }
      if (subPackageRoot) {
        resource = addQuery(resource, {
          subPackageRoot
        })
      }
      addEntrySafely(resource, componentPath, callback)
    })
  }

  if (isApp) {
    // app.json
    const subPackagesCfg = {}
    const localPages = []
    const processSubPackagesQueue = []
    // 确保首页不变
    const firstPage = json.pages && json.pages[0]

    const processPackages = (packages, context, callback) => {
      if (packages) {
        async.forEach(packages, (packagePath, callback) => {
          let queryIndex = packagePath.indexOf('?')
          let packageQuery = '?'
          if (queryIndex >= 0) {
            packageQuery = packagePath.substr(queryIndex)
            packagePath = packagePath.substr(0, queryIndex)
          }
          let queryObj = loaderUtils.parseQuery(packageQuery)
          async.waterfall([
            (callback) => {
              this.resolve(context, packagePath, (err, result) => {
                callback(err, result)
              })
            },
            (result, callback) => {
              fs.readFile(result, (err, content) => {
                callback(err, result, content.toString('utf-8'))
              })
            },
            (result, content, callback) => {
              const filePath = result
              const extName = path.extname(filePath)
              if (extName === '.mpx' || extName === '.vue') {
                const parts = parse(
                  content,
                  filePath,
                  this.sourceMap,
                  mode
                )
                if (parts.json) {
                  content = parts.json.content
                }
              }
              try {
                content = JSON.parse(content)
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
        mpx.processingSubPackageRoot = tarRoot
        componentsMap[tarRoot] = {}
        resourceMap[tarRoot] = {}
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

    const processPages = (pages, srcRoot = '', tarRoot = '', context, callback) => {
      if (pages) {
        async.forEach(pages, (page, callback) => {
          const rawPage = page
          if (resolveMode === 'native') {
            page = loaderUtils.urlToRequest(page, options.root)
          }
          let name = getPageName(tarRoot, rawPage)
          name = toPosix(name)
          this.resolve(path.join(context, srcRoot), page, (err, resource) => {
            if (err) return callback(err)
            let resourcePath = getResourcePath(resource)
            const parsed = path.parse(resourcePath)
            const ext = parsed.ext
            // 如果存在page命名冲突，return err
            for (let key in pagesMap) {
              if (pagesMap[key] === name && key !== resourcePath) {
                return callback(new Error(`Resources in ${resourcePath} and ${key} are registered with same page path ${name}, which is not allowed!`))
              }
            }
            // 目前暂时不支持多个分包复用同一个页面
            // 如果之前已经创建了入口，直接return
            if (pagesMap[resourcePath]) return callback()
            pagesMap[resourcePath] = name
            if (tarRoot && subPackagesCfg[tarRoot]) {
              subPackagesCfg[tarRoot].pages.push(toPosix(path.join('', page)))
            } else {
              // 确保首页不变
              if (rawPage === firstPage) {
                localPages.unshift(name)
              } else {
                localPages.push(name)
              }
            }
            if (ext === '.js') {
              resource = '!!' + nativeLoaderPath + '!' + resource
            }
            addEntrySafely(resource, name, callback)
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
          if (item[iconKey] && isUrlRequest(item[iconKey], options.root)) {
            output += `json.tabBar.${itemKey}[${index}].${iconKey} = require("${loaderUtils.urlToRequest(item[iconKey], options.root)}");\n`
          }
          if (item[activeIconKey] && isUrlRequest(item[activeIconKey], options.root)) {
            output += `json.tabBar.${itemKey}[${index}].${activeIconKey} = require("${loaderUtils.urlToRequest(item[activeIconKey], options.root)}");\n`
          }
        })
      }
      return output
    }

    const processOptionMenu = (output) => {
      let optionMenuCfg = config[mode].optionMenu
      if (optionMenuCfg && json.optionMenu) {
        let iconKey = optionMenuCfg.iconKey
        if (json.optionMenu[iconKey] && isUrlRequest(json.optionMenu[iconKey], options.root)) {
          output += `json.optionMenu.${iconKey} = require("${loaderUtils.urlToRequest(json.optionMenu[iconKey], options.root)}");\n`
        }
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

    // 保存全局注册组件
    if (json.usingComponents) {
      mpx.usingComponents = Object.keys(json.usingComponents)
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
