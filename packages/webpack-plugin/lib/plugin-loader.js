const path = require('path')
const async = require('async')
const hash = require('hash-sum')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const parseRequest = require('./utils/parse-request')
const toPosix = require('./utils/to-posix')

// webpack4中.json文件会走json parser，抽取内容的占位内容必须为合法json，否则会在parse阶段报错
const defaultResultSource = '{}'

module.exports = function (source) {
  // 该loader中会在每次编译中动态添加entry，不能缓存，否则watch不好使
  this.cacheable(false)

  const nativeCallback = this.async()
  const mpx = this._compilation.__mpx__

  if (!mpx) {
    return nativeCallback(null, source)
  }

  const packageName = 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const extract = mpx.extract
  const resourceName = this._compilation._preparedEntrypoints[0].name
  this._compilation._preparedEntrypoints.pop()

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
    pluginEntry = JSON.parse(source)
  } catch (err) {
    return callback(err)
  }

  function getName (raw) {
    const match = /^(.*?)(\.[^.]*)?$/.exec(raw)
    return match[1]
  }

  let processMain, processComponents, processPages

  processMain = processComponents = processPages = (callback) => {
    callback()
  }

  if (pluginEntry.main) {
    processMain = function (main, callback) {
      this.resolve(this.context, main, (err, result) => {
        if (err) return callback(err)
        let mainPath = getName(path.join('', main))
        mainPath = toPosix(mainPath)
        if (/^\./.test(mainPath)) {
          return callback(new Error(`Main's path ${main} which is referenced in ${this.context} must be a subdirectory of ${this.context}!`))
        }
        pluginEntry.main = mainPath + '.js'
        addEntrySafely(result, mainPath, callback)
        mpx.pluginMain = mainPath
      })
    }.bind(this, pluginEntry.main)
  }

  if (pluginEntry.publicComponents) {
    processComponents = function (components, callback) {
      async.forEachOf(components, (component, name, callback) => {
        this.resolve(this.context, component, (err, result) => {
          if (err) return callback(err)
          result = parseRequest(result).resourcePath
          let parsed = path.parse(result)
          let componentName = parsed.name
          let dirName = componentName + hash(result)
          let componentPath = path.join('components', dirName, componentName)
          componentPath = toPosix(componentPath)
          // 如果之前已经创建了入口，直接return
          if (componentsMap[result] === componentPath) return callback()
          componentsMap[result] = componentPath
          pluginEntry.publicComponents[name] = componentPath
          addEntrySafely(result, componentPath, callback)
        })
      }, callback)
    }.bind(this, pluginEntry.publicComponents)
  }

  if (pluginEntry.pages) {
    processPages = function (pages, callback) {
      async.forEachOf(pages, (page, name, callback) => {
        this.resolve(this.context, page, (err, result) => {
          if (err) return callback(err)
          result = parseRequest(result).resourcePath
          let pagePath = getName(path.join('', page))
          pagePath = toPosix(pagePath)
          if (/^\./.test(pagePath)) {
            return callback(new Error(`Page's path ${page} which is referenced in ${this.context} must be a subdirectory of ${this.context}!`))
          }
          // 如果存在page命名冲突，return err
          for (let key in pagesMap) {
            if (pagesMap[key] === pagePath && key !== result) {
              return callback(new Error(`Resources in ${result} and ${key} are registered with same page path ${pagePath}, which is not allowed!`))
            }
          }
          // 如果之前已经创建了入口，直接return
          if (pagesMap[result] === pagePath) return callback()
          pagesMap[result] = pagePath
          pluginEntry.pages[name] = pagePath
          addEntrySafely(result, pagePath, callback)
        })
      }, callback)
    }.bind(this, pluginEntry.pages)
  }

  async.parallel([processMain, processComponents, processPages], callback)
}
