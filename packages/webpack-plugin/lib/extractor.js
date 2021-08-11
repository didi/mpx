const loaderUtils = require('loader-utils')
const path = require('path')
const NormalModule = require('webpack/lib/NormalModule')
const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin')
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin')
const EntryPlugin = require('webpack/lib/EntryPlugin')
const LimitChunkCountPlugin = require('webpack/lib/optimize/LimitChunkCountPlugin')
// const ChildCompileDependency = require('./dependencies/ChildCompileDependency')
const normalize = require('./utils/normalize')
const parseRequest = require('./utils/parse-request')
const getMainCompilation = require('./utils/get-main-compilation')
const toPosix = require('./utils/to-posix')
const config = require('./config')
const fixRelative = require('./utils/fix-relative')
const NativeModule = require('module')
const AssetDependency = require('./dependencies/AssetDependency')
const ExtractDependency = require('./dependencies/ExtractDependency')
const Cache = require('webpack/lib/Cache')

const defaultResultSource = '// removed by extractor'

module.exports = function (content) {
  this.cacheable()
  const options = loaderUtils.getOptions(this) || {}

  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__

  const pagesMap = mpx.pagesMap

  const pathHash = mpx.pathHash
  const extractedMap = mpx.extractedMap
  const mode = mpx.mode
  const typeExtMap = config[mode].typeExtMap

  const rootEntry = mainCompilation.entries.values().next().value
  const rootName = rootEntry.options.name
  const rootDep = rootEntry.dependencies[0]
  const rootModule = mainCompilation.moduleGraph.getModule(rootDep)
  const rootResourcePath = parseRequest(rootModule.resource).resourcePath

  let resultSource = defaultResultSource

  // todo getFile考虑要不要放在外部处理，将extractor的资源在addModule时就确定输出位置
  const getFile = (resourceRaw, type) => {
    const { resourcePath, queryObj } = parseRequest(resourceRaw)
    const currentPackageName = queryObj.packageName || mpx.currentPackageRoot || 'main'
    const componentsMap = mpx.componentsMap[currentPackageName]
    let filename = pagesMap[resourcePath] || componentsMap[resourcePath]
    if (!filename && resourcePath === rootResourcePath) {
      filename = rootName
    }
    if (filename) {
      return filename + typeExtMap[type]
    } else {
      const resourceName = path.parse(resourcePath).name
      const outputPath = path.join(type, resourceName + pathHash(resourcePath) + typeExtMap[type])
      return mpx.getPackageInfo({
        resource: resourceRaw,
        outputPath,
        resourceType: 'staticResources',
        warn: (err) => {
          this.emitWarning(err)
        }
      }).outputPath
    }
  }

  const exec = (code, filename) => {
    const module = new NativeModule(filename, this)
    module.paths = NativeModule._nodeModulePaths(this.context)
    module.filename = filename
    module._compile(code, filename)
    return module.exports
  }

  const type = options.type
  const fromImport = options.fromImport
  const index = +options.index || 0
  const { queryObj } = parseRequest(this.resource)

  let issuerFile
  if (queryObj.issuerResource) {
    issuerFile = getFile(queryObj.issuerResource, type)
  }

  const file = getFile(this.resource, type)
  const filename = /(.*)\..*/.exec(file)[1]

  if (index === -1) {
    // 需要返回路径或产生副作用
    switch (type) {
      // styles中index为-1就两种情况，一种是.mpx中使用src引用样式，第二种为css-loader中处理@import
      // 为了支持持久化缓存，.mpx中使用src引用样式对issueFile asset产生的副作用迁移到ExtractDependency中处理
      case 'styles':
        if (issuerFile && fromImport) {
          const relativePath = fixRelative(toPosix(path.relative(path.dirname(issuerFile), file)), mode)
          resultSource = `module.exports = ${JSON.stringify(relativePath)};`
        }
        break
      case 'template':
        resultSource = `module.exports = __webpack_public_path__ + ${JSON.stringify(file)};`
        break
      case 'json':
        // 目前json中index为-1时只有处理theme.json一种情况，该情况下返回的路径只能为不带有./或../开头的相对路径，否则微信小程序预览构建会报错，issue#622
        resultSource = `module.exports = ${JSON.stringify(file)};`
        break
    }
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
    new EntryPlugin(this.context, request, { name: filename }),
    new LimitChunkCountPlugin({ maxChunks: 1 })
  ])


  // todo 消除子编译cache能力避免bad case，后续考虑更优的方式来处理
  childCompiler.cache = new Cache()

  let source
  childCompiler.hooks.thisCompilation.tap('MpxWebpackPlugin', (compilation) => {
    // 将主编译入口module层层子编译传递下去，所有子编译的资源dep均挂载到主编译入口module中
    compilation.rootModule = this._compilation.rootModule || this._module
    NormalModule.getCompilationHooks(compilation).loader.tap('MpxWebpackPlugin', (loaderContext) => {
      // 传递编译结果，子编译器进入content-loader后直接输出
      loaderContext.__mpx__ = {
        content,
        fileDependencies: this.getDependencies(),
        contextDependencies: this.getContextDependencies()
      }
    })
    compilation.hooks.succeedEntry.tap('MpxWebpackPlugin', (entry, name, module) => {
      // const dep = new ChildCompileDependency(module)
      // extractedMap[id].dep = dep
    })
    compilation.hooks.processAssets.tap({
      name: 'MpxWebpackPlugin',
      stage: compilation.PROCESS_ASSETS_STAGE_SUMMARIZE
    }, () => {
      source = compilation.assets[childFilename] && compilation.assets[childFilename].source()
      // Remove all chunk assets
      compilation.chunks.forEach((chunk) => {
        chunk.files.forEach((file) => {
          delete compilation.assets[file]
        })
      })
      // 使用assetDependency输出子编译静态资源便于持久化缓存
      for (const { name, source, info } of compilation.getAssets()) {
        compilation.rootModule.addPresentationalDependency(new AssetDependency(name, source, info))
      }
      compilation.assets = {}
      compilation.assetsInfo.clear()
    })
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
      let text = exec(source, request)
      if (Array.isArray(text)) {
        text = text.map((item) => {
          return item[1]
        }).join('\n')
      }

      if (compilation.rootModule) {
        // 改用dep的方式进行静态文件抽取，便于持久化缓存
        compilation.rootModule.addPresentationalDependency(new ExtractDependency(text, file, index, {
          type,
          issuerFile,
          fromImport
        }))
      }
      // 在production模式下移除extract残留空模块
      // if (resultSource === defaultResultSource && this.minimize) {
      //   this._module.needRemove = true
      // }
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
