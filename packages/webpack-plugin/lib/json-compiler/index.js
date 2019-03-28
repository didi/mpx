const async = require('async')
const path = require('path')
const hash = require('hash-sum')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const loaderUtils = require('loader-utils')
const parse = require('../parser')
const config = require('../config')
const normalize = require('../utils/normalize')
const nativeLoaderPath = normalize.lib('native-loader')
const stripExtension = require('../utils/strip-extention')
const toPosix = require('../utils/to-posix')
const stringifyQuery = require('../utils/stringify-query')

module.exports = function (raw) {
  // 该loader中会在每次编译中动态添加entry，不能缓存，否则watch不好使
  this.cacheable(false)
  const nativeCallback = this.async()

  if (!this._compilation.__mpx__) {
    return nativeCallback(null, raw)
  }

  const pagesMap = this._compilation.__mpx__.pagesMap
  const componentsMap = this._compilation.__mpx__.componentsMap
  const subPackagesMap = this._compilation.__mpx__.subPackagesMap
  const compilationMpx = this._compilation.__mpx__
  const mode = this._compilation.__mpx__.mode
  const resource = stripExtension(this.resource)
  const isApp = !(pagesMap[resource] || componentsMap[resource])
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
    json = JSON.parse(raw)
  } catch (err) {
    return callback(err)
  }

  function getName (raw) {
    const match = /^(.*?)(\.[^.]*)?$/.exec(raw)
    return match[1]
  }

  const processComponent = (component, context, rewritePath, componentPath, callback) => {
    if (/^plugin:\/\//.test(component)) {
      return callback()
    }
    this.resolve(context, component, (err, result, info) => {
      if (err) return callback(err)
      const queryIndex = result.indexOf('?')
      if (queryIndex >= 0) {
        result = result.substr(0, queryIndex)
      }
      let parsed = path.parse(result)
      let ext = parsed.ext
      result = stripExtension(result)
      let subPackageRoot = ''
      if (compilationMpx.processingSubPackages) {
        for (let src in subPackagesMap) {
          // 分包引用且主包为引用的组件，需打入分包目录中
          if (result.startsWith(src) && !componentsMap[result]) {
            subPackageRoot = subPackagesMap[src]
            break
          }
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
            name = info.descriptionFileData.name
          }
        }
        let relativePath = path.relative(root, result)
        componentPath = componentPath || path.join(subPackageRoot, 'components', name + hash(root), relativePath)
      } else {
        let componentName = parsed.name
        componentPath = componentPath || path.join(subPackageRoot, 'components', componentName + hash(result), componentName)
      }
      componentPath = toPosix(componentPath)
      rewritePath && rewritePath(publicPath + componentPath)
      // 如果之前已经创建了入口，直接return
      if (componentsMap[result] === componentPath) return callback()
      componentsMap[result] = componentPath
      if (ext === '.js') {
        result = '!!' + nativeLoaderPath + '!' + result
      }
      addEntrySafely(result, componentPath, callback)
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
              const fileName = path.basename(filePath)
              const extName = path.extname(filePath)
              if (extName === '.mpx') {
                const parts = parse(
                  content,
                  fileName,
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
                  let subPackages = [
                    {
                      tarRoot,
                      pages: content.pages,
                      ...queryObj
                    }
                  ]
                  processSubPackagesQueue.push((callback) => {
                    processSubPackages(subPackages, context, callback)
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

    const processSubPackages = (subPackages, context, callback) => {
      if (subPackages) {
        async.forEach(subPackages, (packageItem, callback) => {
          let tarRoot = packageItem.tarRoot || packageItem.root || ''
          let srcRoot = packageItem.srcRoot || packageItem.root || ''
          let resource = path.join(context, srcRoot)
          if (!tarRoot || subPackagesMap[resource] === tarRoot) return callback()

          subPackagesMap[resource] = tarRoot
          subPackagesCfg[tarRoot] = {
            root: tarRoot,
            pages: [],
            ...getOtherConfig(packageItem)
          }

          processPages(packageItem.pages, srcRoot, tarRoot, context, callback)
        }, callback)
      } else {
        callback()
      }
    }

    const processPages = (pages, srcRoot = '', tarRoot = '', context, callback) => {
      if (pages) {
        async.forEach(pages, (page, callback) => {
          let name = getName(path.join(tarRoot, page))
          name = toPosix(name)
          if (/^\./.test(name)) {
            return callback(new Error(`Page's path ${page} which is referenced in ${context} must be a subdirectory of ${context}!`))
          }
          async.waterfall([
            (callback) => {
              this.resolve(path.join(context, srcRoot), page, (err, result) => {
                callback(err, result)
              })
            },
            (result, callback) => {
              const queryIndex = result.indexOf('?')
              if (queryIndex >= 0) {
                result = result.substr(0, queryIndex)
              }
              let parsed = path.parse(result)
              let ext = parsed.ext
              result = stripExtension(result)
              // 如果存在page命名冲突，return err
              for (let key in pagesMap) {
                if (pagesMap[key] === name && key !== result) {
                  return callback(new Error(`Resources in ${result} and ${key} are registered with same page path ${name}, which is not allowed!`))
                }
              }
              // 如果之前已经创建了入口，直接return
              if (pagesMap[result] === name) return callback()
              pagesMap[result] = name
              if (tarRoot && subPackagesCfg[tarRoot]) {
                subPackagesCfg[tarRoot].pages.push(toPosix(path.join('', page)))
              } else {
                // 确保首页不变
                if (page === firstPage) {
                  localPages.unshift(name)
                } else {
                  localPages.push(name)
                }
              }
              if (ext === '.js') {
                result = '!!' + nativeLoaderPath + '!' + result
              }
              addEntrySafely(result, name, callback)
            }
          ], callback)
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

      // tabBarIcon只支持路径，为了避免用户困扰，用此方法补上?fallback避免base64转换
      const tabBarIconPathAddFallback = str => {
        const tempArr = str.split('?')
        if (tempArr.length === 1) {
          return str + '?fallback'
        }
        if (tempArr.length > 2) {
          // illegal query string, do not process
          return str
        }
        const queryStr = tempArr[1]
        const parsedQuery = loaderUtils.parseQuery('?' + queryStr)
        if (parsedQuery.fallback) {
          return str
        } else {
          parsedQuery.fallback = true
          tempArr[1] = stringifyQuery(parsedQuery).slice(1)
          return tempArr.join('?')
        }
      }

      if (json.tabBar && json.tabBar[itemKey]) {
        json.tabBar[itemKey].forEach((item, index) => {
          if (item.iconPath) {
            output += `json.tabBar.${itemKey}[${index}].${iconKey} = require("${tabBarIconPathAddFallback(item[iconKey])}");\n`
          }
          if (item.selectedIconPath) {
            output += `json.tabBar.${itemKey}[${index}].${activeIconKey} = require("${tabBarIconPathAddFallback(item[activeIconKey])}");\n`
          }
        })
      }
      return output
    }

    const processOptionMenu = (output) => {
      let optionMenuCfg = config[mode].optionMenu
      if (optionMenuCfg && json.optionMenu) {
        let iconKey = optionMenuCfg.iconKey
        output += `json.optionMenu.${iconKey} = require("${json.optionMenu[iconKey]}");\n`
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
    async.series([
      async.applyEach([
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
        }
      ]),
      (callback) => {
        compilationMpx.processingSubPackages = true
        callback()
      },
      (callback) => {
        async.parallel([
          ...processSubPackagesQueue,
          (callback) => {
            processSubPackages(json.subPackages || json.subpackages, this.context, callback)
          }
        ], callback)
      }
    ], (err) => {
      if (err) return callback(err)
      delete json.packages
      delete json.subpackages
      json.pages = localPages
      json.subPackages = []
      for (let root in subPackagesCfg) {
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
