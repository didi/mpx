const loaderUtils = require('loader-utils')
const path = require('path')
const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin')
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin')
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin')
const LimitChunkCountPlugin = require('webpack/lib/optimize/LimitChunkCountPlugin')
const normalize = require('./utils/normalize')
const stripExtension = require('./utils/strip-extention')
const getMainCompilation = require('./utils/get-main-compilation')
const toPosix = require('./utils/to-posix')
const config = require('./config')
const hash = require('hash-sum')
const fixSwanRelative = require('./utils/fix-swan-relative')

const defaultResultSource = '// removed by extractor'

function getResourcePath (resource) {
  return resource.split('?').pop()
}

function getResource (request) {
  return request.split('!').pop()
}

module.exports = function (content) {
  this.cacheable()
  const options = loaderUtils.getOptions(this) || {}

  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__

  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap
  const extract = mpx.extract
  const extractedMap = mpx.extractedMap
  const mode = mpx.mode
  const typeExtMap = config[mode].typeExtMap

  const rootName = mainCompilation._preparedEntrypoints[0].name
  const rootResource = stripExtension(getResource(mainCompilation._preparedEntrypoints[0].request))

  const resourceRaw = this.resource
  const issuerResourceRaw = options.resource

  let resultSource = defaultResultSource

  const seenFile = {}

  function getFile (resourceRaw, type) {
    const resourcePath = getResourcePath(resourceRaw)
    const id = `${type}:${resourcePath}`
    if (!seenFile[id]) {
      const resource = stripExtension(resourceRaw)
      let filename = pagesMap[resource] || componentsMap[resource]
      if (!filename && resource === rootResource) {
        filename = rootName
      }

      if (filename) {
        seenFile[id] = filename + typeExtMap[type]
      } else {
        const subPackagesMap = mpx.subPackagesMap
        const mainResourceMap = mpx.mainResourceMap
        const resourceName = path.parse(resourcePath).name

        let subPackageRoot = ''
        if (mpx.processingSubPackages) {
          for (let src in subPackagesMap) {
            // 分包引用且主包未引用的资源，需打入分包目录中
            if (!path.relative(src, resourcePath).startsWith('..') && !mainResourceMap[resourcePath]) {
              subPackageRoot = subPackagesMap[src]
              break
            }
          }
        } else {
          mainResourceMap[resourcePath] = true
        }
        seenFile[id] = toPosix(path.join(subPackageRoot, type, resourceName + hash(resourcePath) + typeExtMap[type]))
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
  let sideEffects = () => {
  }

  if (index === -1) {
    // 需要返回路径或产生副作用
    switch (type) {
      case 'styles':
        if (issuerFile) {
          let relativePath = toPosix(path.relative(path.dirname(issuerFile), file))
          if (mode === 'swan') {
            relativePath = fixSwanRelative(relativePath)
          }
          if (fromImport) {
            resultSource = `module.exports = ${JSON.stringify(relativePath)};`
          } else {
            sideEffects = (additionalAssets) => {
              additionalAssets[issuerFile] = additionalAssets[issuerFile] || []
              additionalAssets[issuerFile].prefix = additionalAssets[issuerFile].prefix || []
              additionalAssets[issuerFile].prefix.push(`@import "${relativePath}";\n`)
            }
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

  let nativeCallback
  // 由于webpack中moduleMap只在compilation维度有效，不同子编译之间可能会对相同的引用文件进行重复的无效抽取，建立全局extractedMap避免这种情况出现
  if (extractedMap[id]) {
    return extractedMap[id]
  } else {
    extractedMap[id] = resultSource
    nativeCallback = this.async()
  }

  // 使用子编译器生成需要抽离的json，styles和template
  const contentLoader = normalize.lib('content-loader')
  let request = `!!${contentLoader}?${JSON.stringify(options)}!${this.resource}`

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

  childCompiler.hooks.thisCompilation.tap('MpxWebpackPlugin ', (compilation) => {
    compilation.hooks.normalModuleLoader.tap('MpxWebpackPlugin', (loaderContext, module) => {
      // 传递编译结果，子编译器进入content-loader后直接输出
      loaderContext.__mpx__ = {
        content,
        fileDependencies: this.getDependencies(),
        contextDependencies: this.getContextDependencies()
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

      if (resultSource === defaultResultSource) {
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
