const loaderUtils = require('loader-utils')
const path = require('path')
const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin')
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const LimitChunkCountPlugin = require('webpack/lib/optimize/LimitChunkCountPlugin')
const ChildCompileDependency = require('./dependency/ChildCompileDependency')
const normalize = require('./utils/normalize')
const parseRequest = require('./utils/parse-request')
const getMainCompilation = require('./utils/get-main-compilation')
const toPosix = require('./utils/to-posix')
const config = require('./config')
const fixRelative = require('./utils/fix-relative')

const defaultResultSource = '// removed by extractor'

module.exports = function (content) {
  this.cacheable()
  const options = loaderUtils.getOptions(this) || {}

  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__

  const packageName = mpx.currentPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]

  const extract = mpx.extract
  const pathHash = mpx.pathHash
  const extractedMap = mpx.extractedMap
  const mode = mpx.mode
  const seenFile = mpx.extractSeenFile
  const typeExtMap = config[mode].typeExtMap

  const rootName = mainCompilation._preparedEntrypoints[0].name
  const rootRequest = mainCompilation._preparedEntrypoints[0].request
  const rootModule = mainCompilation.entries.find((module) => {
    return module.rawRequest === rootRequest
  })
  const rootResourcePath = parseRequest(rootModule.resource).resourcePath

  const resourceRaw = this.resource
  const issuerResourceRaw = options.issuerResource

  let resultSource = defaultResultSource

  const getFile = (resourceRaw, type) => {
    const resourcePath = parseRequest(resourceRaw).resourcePath
    const id = `${mode}:${packageName}:${type}:${resourcePath}`
    if (!seenFile[id]) {
      const resourcePath = parseRequest(resourceRaw).resourcePath
      let filename = pagesMap[resourcePath] || componentsMap[resourcePath]
      if (!filename && resourcePath === rootResourcePath) {
        filename = rootName
      }

      if (filename) {
        seenFile[id] = filename + typeExtMap[type]
      } else {
        const resourceName = path.parse(resourcePath).name
        const outputPath = path.join(type, resourceName + pathHash(resourcePath) + typeExtMap[type])
        seenFile[id] = mpx.getPackageInfo(resourceRaw, {
          outputPath,
          isStatic: true,
          error: (err) => {
            this.emitError(err)
          },
          warn: (err) => {
            this.emitWarning(err)
          }
        }).outputPath
      }
    }
    return seenFile[id]
  }

  const type = options.type
  const fromImport = options.fromImport
  let index = +options.index

  let issuerFile
  if (issuerResourceRaw) {
    issuerFile = getFile(issuerResourceRaw, type)
  }

  const file = getFile(resourceRaw, type)
  const filename = /(.*)\..*/.exec(file)[1]

  const sideEffects = []

  sideEffects.push((additionalAssets) => {
    additionalAssets[file].modules = additionalAssets[file].modules || []
    additionalAssets[file].modules.push(this._module)
  })

  if (index === -1) {
    // 需要返回路径或产生副作用
    switch (type) {
      // styles中index为-1就两种情况，一种是.mpx中使用src引用样式，第二种为css-loader中处理@import
      case 'styles':
        if (issuerFile) {
          let relativePath = toPosix(path.relative(path.dirname(issuerFile), file))
          relativePath = fixRelative(relativePath, mode)
          if (fromImport) {
            resultSource = `module.exports = ${JSON.stringify(relativePath)};`
          } else {
            sideEffects.push((additionalAssets) => {
              additionalAssets[issuerFile] = additionalAssets[issuerFile] || []
              additionalAssets[issuerFile].prefix = additionalAssets[issuerFile].prefix || []
              additionalAssets[issuerFile].prefix.push(`@import "${relativePath}";\n`)
              additionalAssets[issuerFile].relativeModules = additionalAssets[issuerFile].relativeModules || []
              additionalAssets[issuerFile].relativeModules.push(this._module)
            })
          }
        }
        break
      case 'template':
        resultSource = `module.exports = __webpack_public_path__ + ${JSON.stringify(file)};`
        break
    }
    index = 0
  }

  const id = `${file}:${index}:${issuerFile}:${fromImport}`

  // 由于webpack中moduleMap只在compilation维度有效，不同子编译之间可能会对相同的引用文件进行重复的无效抽取，建立全局extractedMap避免这种情况出现
  if (extractedMap[id]) {
    extractedMap[id].modules.push(this._module)
    return extractedMap[id].resultSource
  }
  const nativeCallback = this.async()
  extractedMap[id] = {
    resultSource,
    dep: null,
    modules: [this._module]
  }

  // 使用子编译器生成需要抽离的json，styles和template
  const contentLoader = normalize.lib('content-loader')
  const request = `!!${contentLoader}?${JSON.stringify(options)}!${this.resource}`

  const childFilename = 'extractor-filename'
  const outputOptions = {
    filename: childFilename
  }
  const childCompiler = mainCompilation.createChildCompiler(request, outputOptions, [
    new NodeTemplatePlugin(outputOptions),
    new LibraryTemplatePlugin(null, 'commonjs2'),
    new NodeTargetPlugin(),
    new SingleEntryPlugin(this.context, request, filename),
    new LimitChunkCountPlugin({ maxChunks: 1 })
  ])

  childCompiler.hooks.thisCompilation.tap('MpxWebpackPlugin', (compilation) => {
    compilation.hooks.normalModuleLoader.tap('MpxWebpackPlugin', (loaderContext) => {
      // 传递编译结果，子编译器进入content-loader后直接输出
      loaderContext.__mpx__ = {
        content,
        fileDependencies: this.getDependencies(),
        contextDependencies: this.getContextDependencies()
      }
    })
    compilation.hooks.succeedEntry.tap('MpxWebpackPlugin', (entry, name, module) => {
      const dep = new ChildCompileDependency(module)
      extractedMap[id].dep = dep
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
      mainCompilation.errors.push(...compilation.errors)
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

      extract(text, file, index, sideEffects)

      // 在production模式下移除extract残留空模块
      if (resultSource === defaultResultSource && this.minimize) {
        this._module.needRemove = true
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
