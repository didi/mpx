const loaderUtils = require('loader-utils')
const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin')
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const LimitChunkCountPlugin = require('webpack/lib/optimize/LimitChunkCountPlugin')
const normalize = require('./utils/normalize')
const stripExtension = require('./utils/strip-extention')

const defaultResultSource = '// removed by extractor'

module.exports = function (content) {
  this.cacheable()
  const options = loaderUtils.getOptions(this) || {}
  const nativeCallback = this.async()

  if (!this._compilation.__mpx__) {
    return nativeCallback(null, content)
  }

  const pagesMap = this._compilation.__mpx__.pagesMap
  const componentsMap = this._compilation.__mpx__.componentsMap
  const extract = this._compilation.__mpx__.extract
  const rootName = this._compilation._preparedEntrypoints[0].name

  const resource = stripExtension(this.resource)
  const resourcePath = pagesMap[resource] || componentsMap[resource] || rootName

  // 使用子编译器生成需要抽离的json，styles和template
  const contentLoader = normalize.lib('content-loader')
  let request = `!!${contentLoader}?${JSON.stringify(options)}!${this.resource}`
  let resultSource = defaultResultSource
  const childFilename = 'extractor-filename'
  const outputOptions = {
    filename: childFilename
  }
  const childCompiler = this._compilation.createChildCompiler(request, outputOptions, [
    new NodeTemplatePlugin(outputOptions),
    new LibraryTemplatePlugin(null, 'commonjs2'),
    new NodeTargetPlugin(),
    new SingleEntryPlugin(this.context, request, resourcePath),
    new LimitChunkCountPlugin({maxChunks: 1})
  ])

  childCompiler.hooks.thisCompilation.tap('MpxWebpackPlugin', (compilation) => {
    compilation.hooks.normalModuleLoader.tap('MpxWebpackPlugin', (loaderContext, module) => {
      // 传递编译结果，子编译器进入content-loader后直接输出
      loaderContext.__mpx__ = {
        content
      }
    })
  })

  let source

  childCompiler.hooks.afterCompile.tapAsync('MpxWebpackPlugin', (compilation, callback) => {
    source = compilation.assets[childFilename] && compilation.assets[childFilename].source()

    // Remove all chunk assets
    compilation.chunks.forEach((chunk) => {
      chunk.files.forEach((file) => {
        delete compilation.assets[file]
      })
    })

    callback()
  })

  childCompiler.runAsChild((err, entries, compilation) => {
    if (err) return nativeCallback(err)
    if (compilation.errors.length > 0) {
      return nativeCallback(compilation.errors[0])
    }

    compilation.fileDependencies.forEach((dep) => {
      this.addDependency(dep)
    }, this)
    compilation.contextDependencies.forEach((dep) => {
      this.addContextDependency(dep)
    }, this)

    if (!source) {
      return nativeCallback(new Error('Didn\'t get a result from child compiler'))
    }

    try {
      let text = this.exec(source, request)
      if (Array.isArray(text)) {
        text = text.map((item) => {
          return item[1]
        }).join('\n')
      }
      extract(text, options.type, resourcePath, options.index)
      if (text.locals && typeof resultSource !== 'undefined') {
        resultSource += `\nmodule.exports = ${JSON.stringify(text.locals)};`
      }
    } catch (err) {
      return nativeCallback(err)
    }
    if (resultSource) {
      nativeCallback(null, resultSource)
    } else {
      nativeCallback()
    }
  })
}
