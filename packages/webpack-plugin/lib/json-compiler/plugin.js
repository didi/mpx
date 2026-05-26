const async = require('async')
const JSON5 = require('json5')
const getEntryName = require('../utils/get-entry-name')
const FlagPluginDependency = require('../dependencies/FlagPluginDependency')
const RemoveEntryDependency = require('../dependencies/RemoveEntryDependency')
const createJSONHelper = require('./helper')
const { MPX_DISABLE_EXTRACTOR_CACHE, RESOLVE_IGNORED_ERR } = require('../utils/const')

module.exports = function (source) {
  // 该loader中会在每次编译中动态添加entry，不能缓存，否则watch不好使
  const nativeCallback = this.async()

  const mpx = this.getMpx()

  if (!mpx) {
    return nativeCallback(null, source)
  }

  // json模块必须每次都创建（但并不是每次都需要build），用于动态添加编译入口，传递信息以禁用父级extractor的缓存
  this.emitFile(MPX_DISABLE_EXTRACTOR_CACHE, '', undefined, { skipEmit: true })

  this._module.addPresentationalDependency(new FlagPluginDependency())

  const emitWarning = (msg) => {
    this.emitWarning(
      new Error('[Mpx json warning][' + this.resource + ']: ' + msg)
    )
  }

  const emitError = (msg) => {
    this.emitError(
      new Error('[Mpx json error][' + this.resource + ']: ' + msg)
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
  if (entryName) this._module.addPresentationalDependency(new RemoveEntryDependency(entryName))

  // 新模式下plugin.json输出依赖于extractor
  const callback = (err, processOutput) => {
    if (err) return nativeCallback(err)
    let output = `var pluginEntry = ${JSON.stringify(pluginEntry, null, 2)};\n`
    if (processOutput) output = processOutput(output)
    output += 'module.exports = JSON.stringify(pluginEntry, null, 2);\n'
    nativeCallback(null, output)
  }

  let pluginEntry
  try {
    pluginEntry = JSON5.parse(source)
  } catch (err) {
    return callback(err)
  }

  const processMain = (main, callback) => {
    if (!main) return callback()
    processJsExport(main, context, '', (err, entry) => {
      if (err === RESOLVE_IGNORED_ERR) {
        delete pluginEntry.main
        return callback()
      }
      if (err) return callback(err)
      pluginEntry.main = entry
      callback()
    })
  }

  const processComponents = (components, callback) => {
    if (!components) return callback()
    async.eachOf(components, (component, name, callback) => {
      processComponent(component, context, { relativePath }, (err, entry) => {
        if (err === RESOLVE_IGNORED_ERR) {
          delete components[name]
          return callback()
        }
        if (err) return callback(err)
        components[name] = entry
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
      pages = pages.reduce((target, page, index) => {
        const key = reversedMap[page] || `__private_page_${index}__`
        target[key] = page
        return target
      }, {})
    }

    if (mode === 'ali') {
      pluginEntry.publicPages = {}
      pluginEntry.pages = []
    }

    async.eachOf(pages, (page, key, callback) => {
      processPage(page, context, '', (err, entry) => {
        if (err === RESOLVE_IGNORED_ERR) {
          delete pages[key]
          return callback()
        }
        if (err) return callback(err)
        if (mode === 'ali') {
          pluginEntry.pages.push(entry)
          if (!/^__private_page_\d+__$/.test(key)) {
            pluginEntry.publicPages[key] = entry
          }
        } else {
          pages[key] = entry
        }
        callback()
      })
    }, callback)
  }

  async.parallel([
    (callback) => {
      return processMain(pluginEntry.main, callback)
    }, (callback) => {
      return processComponents(pluginEntry.publicComponents, callback)
    }, (callback) => {
      return processPages(pluginEntry.pages, callback)
    }
  ], (err) => {
    return callback(err, processDynamicEntry)
  })
}
