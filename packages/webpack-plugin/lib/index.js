'use strict'

const path = require('path')
const ConcatSource = require('webpack-sources').ConcatSource
const loaderUtils = require('loader-utils')
const ResolveDependency = require('./dependency/ResolveDependency')
const InjectDependency = require('./dependency/InjectDependency')
const NullFactory = require('webpack/lib/NullFactory')
const config = require('./config')
const normalize = require('./utils/normalize')

class MpxWebpackPlugin {
  constructor (options = { mode: 'wx' }) {
    this.options = options
  }

  static loader (options) {
    return { loader: normalize.lib('loader'), options }
  }

  static pluginLoader (options) {
    return { loader: normalize.lib('plugin-loader'), options }
  }

  apply (compiler) {
    // 强制设置publicPath为'/'
    compiler.options.output.publicPath = '/'

    compiler.hooks.thisCompilation.tap('MpxWebpackPlugin', (compilation, params) => {
      const typeExtMap = config[this.options.mode].typeExtMap
      const additionalAssets = {}
      if (!compilation.__mpx__) {
        compilation.__mpx__ = {
          pagesMap: {},
          componentsMap: {},
          mode: this.options.mode,
          extract: (content, type, resourcePath, index) => {
            let file = resourcePath + typeExtMap[type]
            additionalAssets[file] = additionalAssets[file] || []
            additionalAssets[file][index] = (additionalAssets[file][index] || '') + content
          }
        }
      }

      compilation.hooks.additionalAssets.tapAsync('MpxWebpackPlugin', (callback) => {
        for (let file in additionalAssets) {
          let content = new ConcatSource()
          if (additionalAssets[file][-1]) {
            content.add(additionalAssets[file][-1])
          }
          additionalAssets[file].forEach((item) => {
            content.add(item)
          })
          compilation.assets[file] = content
        }
        callback()
      })

      compilation.dependencyFactories.set(ResolveDependency, new NullFactory())
      compilation.dependencyTemplates.set(ResolveDependency, new ResolveDependency.Template())

      compilation.dependencyFactories.set(InjectDependency, new NullFactory())
      compilation.dependencyTemplates.set(InjectDependency, new InjectDependency.Template())

      params.normalModuleFactory.hooks.parser.for('javascript/auto').tap('MpxWebpackPlugin', (parser) => {
        parser.hooks.call.for('__mpx_resolve_path__').tap('MpxWebpackPlugin', (expr) => {
          if (expr.arguments[0]) {
            const resource = expr.arguments[0].value
            const pagesMap = compilation.__mpx__.pagesMap
            const componentsMap = compilation.__mpx__.componentsMap
            const publicPath = compilation.outputOptions.publicPath || ''
            const range = expr.range
            const dep = new ResolveDependency(resource, pagesMap, componentsMap, publicPath, range)
            parser.state.current.addDependency(dep)
            return true
          }
        })
      })
    })

    compiler.hooks.normalModuleFactory.tap('MpxWebpackPlugin', (normalModuleFactory) => {
      normalModuleFactory.hooks.beforeResolve.tapAsync('MpxWebpackPlugin', (data, callback) => {
        let request = data.request
        let elements = request.replace(/^-?!+/, '').replace(/!!+/g, '!').split('!')
        let resourcePath = elements.pop()
        let resourceQuery = '?'
        const queryIndex = resourcePath.indexOf('?')
        if (queryIndex >= 0) {
          resourceQuery = resourcePath.substr(queryIndex)
          resourcePath = resourcePath.substr(0, queryIndex)
        }
        let queryObj = loaderUtils.parseQuery(resourceQuery)
        if (queryObj.resolve) {
          let pathLoader = normalize.lib('path-loader')
          data.request = `!!${pathLoader}!${resourcePath}`
        }
        callback(null, data)
      })
    })

    compiler.hooks.emit.tapAsync('MpxWebpackPlugin', (compilation, callback) => {
      const jsonpFunction = compilation.outputOptions.jsonpFunction

      function getTargetFile (file) {
        let targetFile = file
        const queryStringIdx = targetFile.indexOf('?')
        if (queryStringIdx >= 0) {
          targetFile = targetFile.substr(0, queryStringIdx)
        }
        return targetFile
      }

      const processedChunk = new Set()

      compilation.chunkGroups.forEach((chunkGroup) => {
        let runtimeChunk = chunkGroup.runtimeChunk
        if (!runtimeChunk || !runtimeChunk.files[0]) {
          return
        }

        chunkGroup.chunks.forEach((chunk) => {
          if (!chunk.files[0] || processedChunk.has(chunk)) {
            return
          }
          let originalSource = compilation.assets[chunk.files[0]]
          const source = new ConcatSource()
          if (chunk === runtimeChunk) {
            source.add('/******/ var window = window || {};\n')
            source.add('/******/ \n')
            source.add(originalSource)
            source.add('\n/******/ \n')
            source.add(`module.exports = window[${JSON.stringify(jsonpFunction)}];`)
          } else {
            let selfPath = getTargetFile(chunk.files[0])
            let runtimePath = getTargetFile(runtimeChunk.files[0])
            let relativePath = path.posix.relative(path.posix.dirname(selfPath), runtimePath)
            if (!/^\./.test(relativePath)) {
              relativePath = `.${path.posix.sep}${relativePath}`
            }
            source.add('var window = window || {};\n')
            source.add(`window[${JSON.stringify(jsonpFunction)}] = require("${relativePath}");\n`)
            if (compilation.__mpx__.pluginMain === chunk.name) {
              source.add('module.exports =\n')
            }
            source.add(originalSource)
          }
          compilation.assets[chunk.files[0]] = source
          processedChunk.add(chunk)
        })
      })
      callback()
    })
  }
}

module.exports = MpxWebpackPlugin
