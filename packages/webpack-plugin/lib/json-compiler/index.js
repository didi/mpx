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

module.exports = function (raw) {
  // 该loader中会在每次编译中动态添加entry，不能缓存，否则watch不好使
  this.cacheable(false)
  const nativeCallback = this.async()

  if (!this._compilation.__mpx__) {
    return nativeCallback(null, raw)
  }

  const pagesMap = this._compilation.__mpx__.pagesMap
  const componentsMap = this._compilation.__mpx__.componentsMap
  const mode = this._compilation.__mpx__.mode
  const rootName = this._compilation._preparedEntrypoints[0].name
  const resource = stripExtension(this.resource)
  const resourcePath = pagesMap[resource] || componentsMap[resource] || rootName
  const publicPath = this._compilation.outputOptions.publicPath || ''

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
    const dep = SingleEntryPlugin.createDependency(resource, name)
    entryDeps.add(dep)
    this._compilation.addEntry(this._compiler.context, dep, name, (err, module) => {
      entryDeps.delete(dep)
      checkEntryDeps()
      callback(err, module)
    })
  }

  // 初次处理json
  const callback = (err, processOutput) => {
    checkEntryDeps(() => {
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

  const processComponent = (component, context, rewritePath, callback) => {
    if (/^plugin:\/\//.test(component)) {
      return callback()
    }
    this.resolve(context, component, (err, result, info) => {
      if (err) return callback(err)
      let parsed = path.parse(result)
      let ext = parsed.ext
      result = stripExtension(result)
      if (ext === '.mpx' || ext === '.js') {
        let componentPath
        if (ext === '.js') {
          let root = info.descriptionFileRoot
          if (info.descriptionFileData && info.descriptionFileData.miniprogram) {
            root = path.join(root, info.descriptionFileData.miniprogram)
          }
          let relativePath = path.relative(root, result)
          componentPath = path.join('components', hash(root), relativePath)
        } else {
          let componentName = parsed.name
          componentPath = path.join('components', componentName + hash(result), componentName)
        }
        componentPath = toPosix(componentPath)
        rewritePath(publicPath + componentPath)
        // 如果之前已经创建了入口，直接return
        if (componentsMap[result] === componentPath) return callback()
        componentsMap[result] = componentPath
        if (ext === '.js') {
          result = nativeLoaderPath + '!' + result
        }
        addEntrySafely(result, componentPath, callback)
      } else {
        callback(new Error('Component\'s extension must be .mpx or .js'))
      }
    })
  }

  if (resourcePath === rootName) {
    // app.json

    const subPackagesMap = {}
    const localPages = []
    // 确保首页不变
    const firstPage = json.pages[0]

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
              this._compiler.inputFileSystem.readFile(result, (err, content) => {
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
                  fileName
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
              if (content.pages) {
                let context = path.dirname(result)
                if (queryObj.root && typeof queryObj.root === 'string') {
                  let subPackages = [
                    {
                      tarRoot: queryObj.root,
                      pages: content.pages
                    }
                  ]
                  processSubPackages(subPackages, context, callback)
                } else {
                  processPages(content.pages, '', '', context, callback)
                }
              }
              // 目前只支持单层解析packages，为了兼容subPackages
            }
          ], callback)
        }, callback)
      } else {
        callback()
      }
    }

    const processSubPackages = (subPackages, context, callback) => {
      if (subPackages) {
        async.forEach(subPackages, (packageItem, callback) => {
          let tarRoot = packageItem.tarRoot || packageItem.root
          let srcRoot = packageItem.srcRoot || packageItem.root
          processPages(packageItem.pages, srcRoot, tarRoot, context, callback)
        }, callback)
      } else {
        callback()
      }
    }

    const processPages = (pages, srcRoot, tarRoot, context, callback) => {
      if (pages) {
        srcRoot = srcRoot || ''
        tarRoot = tarRoot || ''
        async.forEach(pages, (page, callback) => {
          let name = getName(path.join(tarRoot, page))
          name = toPosix(name)
          if (/^\./.test(name)) {
            return callback(new Error(`Page's path ${page} which is referenced in ${context} must be a subdirectory of ${context}!`))
          }
          async.waterfall([
            (callback) => {
              if (srcRoot) {
                callback(null, path.join(context, srcRoot, page) + '.mpx')
              } else {
                this.resolve(context, page, (err, result) => {
                  if (err) return callback(err)
                  result = stripExtension(result)
                  callback(err, result)
                })
              }
            },
            (resource, callback) => {
              // 如果存在page命名冲突，return err
              for (let key in pagesMap) {
                if (pagesMap[key] === name && key !== resource) {
                  return callback(new Error(`Resources in ${resource} and ${key} are registered with same page path ${name}, which is not allowed!`))
                }
              }
              // 如果之前已经创建了入口，直接return
              if (pagesMap[resource] === name) return callback()
              pagesMap[resource] = name
              if (tarRoot) {
                if (!subPackagesMap[tarRoot]) {
                  subPackagesMap[tarRoot] = []
                }
                subPackagesMap[tarRoot].push(toPosix(path.join('', page)))
              } else {
                // 确保首页不变
                if (page === firstPage) {
                  localPages.unshift(name)
                } else {
                  localPages.push(name)
                }
              }
              addEntrySafely(resource, name, callback)
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
      if (json.tabBar && json.tabBar[itemKey]) {
        json.tabBar[itemKey].forEach((item, index) => {
          if (item.iconPath) {
            output += `json.tabBar.${itemKey}[${index}].${iconKey} = require("${item[iconKey]}");\n`
          }
          if (item.selectedIconPath) {
            output += `json.tabBar.${itemKey}[${index}].${activeIconKey} = require("${item[activeIconKey]}");\n`
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
          }, callback)
        }, callback)
      } else {
        callback()
      }
    }

    async.parallel([
      (callback) => {
        processPackages(json.packages, this.context, callback)
      },
      (callback) => {
        processSubPackages(json.subPackages, this.context, callback)
      },
      (callback) => {
        processPages(json.pages, '', '', this.context, callback)
      },
      (callback) => {
        processComponents(json.usingComponents, this.context, callback)
      }
    ], (err) => {
      if (err) return callback(err)
      delete json.packages
      json.pages = localPages
      json.subPackages = []
      for (let root in subPackagesMap) {
        let subPackage = {
          root,
          pages: subPackagesMap[root]
        }
        json.subPackages.push(subPackage)
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
        }, callback)
      }, callback)
    } else if (json.componentGenerics) {
      // 处理抽象节点
      async.forEachOf(json.componentGenerics, (genericCfg, name, callback) => {
        if (genericCfg && genericCfg.default) {
          processComponent(genericCfg.default, this.context, (path) => {
            json.componentGenerics[name].default = path
          }, callback)
        } else {
          callback()
        }
      }, callback)
    } else {
      callback()
    }
  }
}
