const path = require('path')
const async = require('async')
const JSON5 = require('json5')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const parseRequest = require('./utils/parse-request')
const toPosix = require('./utils/to-posix')
const getMainCompilation = require('./utils/get-main-compilation')
const isUrlRequestRaw = require('./utils/is-url-request')
const loaderUtils = require('loader-utils')
const normalize = require('./utils/normalize')
const nativeLoaderPath = normalize.lib('native-loader')

// webpack4中.json文件会走json parser，抽取内容的占位内容必须为合法json，否则会在parse阶段报错
const defaultResultSource = '{}'

module.exports = function (source) {
  // 该loader中会在每次编译中动态添加entry，不能缓存，否则watch不好使
  this.cacheable(false)

  const nativeCallback = this.async()
  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__

  const emitError = (msg) => {
    this.emitError(
      new Error('[json compiler][' + this.resource + ']: ' + msg)
    )
  }

  const isUrlRequest = r => isUrlRequestRaw(r, projectRoot)
  const urlToRequest = r => loaderUtils.urlToRequest(r, projectRoot)
  const resolve = (context, request, callback) => {
    const { queryObj } = parseRequest(request)
    context = queryObj.context || context
    return this.resolve(context, request, callback)
  }

  if (!mpx) {
    return nativeCallback(null, source)
  }

  const context = this.context
  const packageName = 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const EntryNode = mpx.EntryNode
  const entryNodesMap = mpx.entryNodesMap
  const entryModulesMap = mpx.entryModulesMap
  const resolveMode = mpx.resolveMode
  const projectRoot = mpx.projectRoot
  const extract = mpx.extract
  const pathHash = mpx.pathHash
  const resourceName = this._compilation._preparedEntrypoints[0].name
  this._compilation._preparedEntrypoints.pop()

  const entryModule = this._module
  // 通过rawRequest关联entryNode和entryModule
  const entryRequest = entryModule.rawRequest
  const entryType = 'PluginJSON'

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
  const callback = (err) => {
    checkEntryDeps(() => {
      if (err) return nativeCallback(err)
      extract(JSON.stringify(pluginEntry), resourceName + '.json', 0)
      nativeCallback(null, defaultResultSource)
    })
  }

  let pluginEntry
  try {
    pluginEntry = JSON5.parse(source)
  } catch (err) {
    return callback(err)
  }

  let processMain, processComponents, processPages

  processMain = processComponents = processPages = (callback) => {
    callback()
  }

  if (pluginEntry.main) {
    processMain = function (main, callback) {
      if (!isUrlRequest(main)) return callback()
      if (resolveMode === 'native') {
        main = urlToRequest(main)
      }
      resolve(context, main, (err, resource) => {
        if (err) return callback(err)
        const { resourcePath } = parseRequest(resource)
        // 获取pageName
        const relative = path.relative(context, resourcePath)
        const mainPath = toPosix(/^(.*?)(\.[^.]*)?$/.exec(relative)[1])
        if (/^\./.test(mainPath)) {
          return callback(new Error(`The plugin's main path ${main} must be in the context ${context}!`))
        }
        pluginEntry.main = mainPath + '.js'
        mpx.pluginMain = mainPath
        currentEntry.addChild(getEntryNode(resource, 'PluginJS'))
        addEntrySafely(resource, mainPath, callback)
      })
    }.bind(this, pluginEntry.main)
  }

  if (pluginEntry.publicComponents) {
    processComponents = function (components, callback) {
      async.forEachOf(components, (component, name, callback) => {
        if (!isUrlRequest(component)) return callback()
        if (resolveMode === 'native') {
          component = urlToRequest(component)
        }
        resolve(context, component, (err, resource, info) => {
          if (err) return callback(err)
          const resourcePath = parseRequest(resource).resourcePath
          const parsed = path.parse(resourcePath)
          const ext = parsed.ext
          let outputPath
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
            const resourceName = path.join(parsed.dir, parsed.name)
            let relativePath = path.relative(root, resourceName)
            outputPath = path.join('components', name + pathHash(root), relativePath)
          } else {
            let componentName = parsed.name
            outputPath = path.join('components', componentName + pathHash(resourcePath), componentName)
          }
          const componentPath = toPosix(outputPath)
          pluginEntry.publicComponents[name] = componentPath
          if (ext === '.js') {
            resource = '!!' + nativeLoaderPath + '!' + resource
          }
          currentEntry.addChild(getEntryNode(resource, 'Component'))
          // 如果之前已经创建了入口，直接return
          if (componentsMap[resource] === componentPath) return callback()
          componentsMap[resource] = componentPath
          addEntrySafely(resource, componentPath, callback)
        })
      }, callback)
    }.bind(this, pluginEntry.publicComponents)
  }

  if (pluginEntry.pages) {
    processPages = function (pages, callback) {
      async.forEachOf(pages, (page, name, callback) => {
        if (!isUrlRequest(page)) return callback()
        if (resolveMode === 'native') {
          page = urlToRequest(page)
        }
        resolve(context, page, (err, resource) => {
          if (err) return callback(err)
          const { resourcePath } = parseRequest(resource)
          const ext = path.extname(resourcePath)
          // 获取pageName
          const relative = path.relative(context, resourcePath)
          const pageName = toPosix(/^(.*?)(\.[^.]*)?$/.exec(relative)[1])
          if (/^\./.test(pageName)) {
            // 如果当前page不存在于context中，插件模式下报错
            return callback(new Error(`Current page ${resourcePath} is not in current pages directory ${context}, which is not allowed in plugin mode!`))
          }
          // 如果当前page与已有page存在命名冲突，插件模式下报错
          for (let key in pagesMap) {
            if (pagesMap[key] === pageName && key !== resourcePath) {
              return callback(new Error(`Current page ${resourcePath} is registered with a conflict page path ${pageName} which is already existed in system, which is not allowed in plugin mode!`))
            }
          }
          pluginEntry.pages[name] = pageName
          if (ext === '.js') {
            resource = '!!' + nativeLoaderPath + '!' + resource
          }
          currentEntry.addChild(getEntryNode(resource, 'Page'))
          // 如果之前已经创建了入口，直接return
          if (pagesMap[resourcePath] === pageName) return callback()
          pagesMap[resourcePath] = pageName
          addEntrySafely(resource, pageName, callback)
        })
      }, callback)
    }.bind(this, pluginEntry.pages)
  }

  async.parallel([processMain, processComponents, processPages], callback)
}
