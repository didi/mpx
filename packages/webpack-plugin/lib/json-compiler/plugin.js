const async = require('async')
const JSON5 = require('json5')
const getEntryName = require('../utils/get-entry-name')
const FlagPluginDependency = require('../dependencies/FlagPluginDependency')
const createJSONHelper = require('./helper')

module.exports = function (source) {
  // 该loader中会在每次编译中动态添加entry，不能缓存，否则watch不好使
  const nativeCallback = this.async()

  const mpx = this.getMpx()

  if (!mpx) {
    return nativeCallback(null, source)
  }

  this._module.addPresentationalDependency(new FlagPluginDependency())

  const emitWarning = (msg) => {
    this.emitWarning(
      new Error('[plugin loader][' + this.resource + ']: ' + msg)
    )
  }

  const emitError = (msg) => {
    this.emitError(
      new Error('[plugin loader][' + this.resource + ']: ' + msg)
    )
  }

  const {
    processPage,
    processDynamicEntry,
    processComponent,
    processJsExport
  } = createJSONHelper({
    loaderContext: this,
    emitWarning,
    emitError
  })

  const context = this.context
  const relativePath = this._compilation.outputOptions.publicPath || ''
  const mode = mpx.mode
  const srcMode = mpx.srcMode
  const entryName = getEntryName(this)
  // 最终输出中不需要为plugin.json产生chunk，而是使用extractor输出，删除plugin.json对应的entrypoint
  if (entryName) this._compilation.entries.delete(entryName)

  let pluginEntry
  try {
    pluginEntry = JSON5.parse(source)
  } catch (err) {
    return callback(err)
  }

  // 新模式下plugin.json输出依赖于extractor
  const callback = (err, processOutput) => {
    if (err) return nativeCallback(err)
    let output = `var pluginEntry = ${JSON.stringify(pluginEntry, null, 2)};\n`
    if (processOutput) output = processOutput(output)
    output += `module.exports = JSON.stringify(pluginEntry, null, 2);\n`
    nativeCallback(null, output)
  }

  const processMain = (main, callback) => {
    if (!main) return callback()
    processJsExport(main, context, '', (err, entry) => {
      if (err) return callback(err)
      pluginEntry.main = entry
      callback()
    })
  }

  const processComponents = (components, callback) => {
    if (!components) return callback()
    async.eachOf(components, (component, name, callback) => {
      processComponent(component, context, { relativePath }, (err, entry) => {
        if (err) return callback(err)
        pluginEntry.publicComponents[name] = entry
        callback()
      })
    }, callback)
  }

  const processPages = (pages, callback) => {
    if (!pages) return callback()
    if (srcMode === 'ali') {
      const reversedMap = {}
      const publicPages = pluginEntry.publicPages || {}
      Object.keys(publicPages).forEach((key) => {
        const item = publicPages[key]
        reversedMap[item] = key
      })
      pages = pages.reduce((page, target, index) => {
        const key = reversedMap[page] || `__private_page_${index}__`
        target[key] = page
      }, {})
    }

    if (mode === 'ali') {
      pluginEntry.publicPages = {}
      pluginEntry.pages = []
    }

    async.eachOf(pages, (page, key) => {
      processPage(page, context, '', (err, entry) => {
        if (err) return callback(err)
        pages[index] = entry
        if (mode === 'ali') {
          pluginEntry.pages.push(entry)
          if (!/^__private_page_\d+__$/.test(key)) {
            pluginEntry.publicPages[key] = entry
          }
        } else {
          pluginEntry.pages[key] = entry
        }
        callback()
      })
    })
  }

  async.parallel([
    (callback) => {
      return processMain(pluginEntry.main, callback)
    }, (callback) => {
      return processComponents(pluginEntry.publicComponents, callback)
    }, (callback) => {
      return processPages(pluginEntry.publicPages, callback)
    }
  ], (err) => {
    return callback(err, processDynamicEntry)
  })
}
