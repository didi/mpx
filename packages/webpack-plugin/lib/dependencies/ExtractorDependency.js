const NullDependency = require('webpack/lib/dependencies/NullDependency')
const LoaderImportDependency = require('webpack/lib/dependencies/LoaderImportDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')
const path = require('path')
const parseRequest = require('../utils/parse-request')
const toPosix = require('../utils/to-posix')
const fixRelative = require('../utils/fix-relative')
const normalize = require('../utils/normalize')

class ExtractorDependency extends NullDependency {
  constructor (remainingRequest) {
    super()
    this.remainingRequest = remainingRequest
  }

  get type () {
    return 'mpx extractor'
  }

  static importModule (request, options = {}, module, compilation, callback) {
    const dep = new LoaderImportDependency(request)
    dep.loc = {
      name: request
    }
    const factory = compilation.dependencyFactories.get(dep.constructor)

    if (factory === undefined) {
      return callback(
        new Error(
          `No module factory available for dependency type: ${dep.constructor.name}`
        )
      )
    }

    const { moduleGraph } = compilation

    compilation.buildQueue.increaseParallelism()
    compilation.handleModuleCreation(
      {
        factory,
        dependencies: [dep],
        originModule: module,
        contextInfo: {
          issuerLayer: options.layer
        },
        connectOrigin: false
      },
      err => {
        compilation.buildQueue.decreaseParallelism()
        if (err) {
          return callback(err)
        }
        const referencedModule = moduleGraph.getModule(dep)
        if (!referencedModule) {
          return callback(new Error('Cannot load the module'))
        }
        compilation.executeModule(
          referencedModule,
          {
            entryOptions: {
              publicPath: options.publicPath
            }
          },
          (err, result) => {
            if (err) return callback(err)
            const { buildInfo } = module

            for (const [name, { source, info }] of result.assets) {
              if (!buildInfo.assets) {
                buildInfo.assets = Object.create(null)
                buildInfo.assetsInfo = new Map()
              }
              buildInfo.assets[name] = source
              buildInfo.assetsInfo.set(name, info)
            }

            buildInfo.buildDependencies.addAll(result.buildDependencies)

            const { snapshot } = buildInfo
            // 没有snapshot不可缓存，可直接跳过
            if (snapshot) {
              const startTime = compilation.compiler.fsStartTime || Date.now()
              const snapshotOptions = compilation.options.snapshot.module
              compilation.fileSystemInfo.createSnapshot(
                startTime,
                result.fileDependencies,
                result.contextDependencies,
                result.missingDependencies,
                snapshotOptions,
                (err, snapshot2) => {
                  if (err) {
                    return callback(err)
                  }
                  buildInfo.snapshot = compilation.fileSystemInfo.mergeSnapshots(snapshot, snapshot2)
                  return callback(null, result.exports)
                }
              )
            } else {
              callback(null, result.exports)
            }
          }
        )
      }
    )
  }

  static emitFile (name, content, sourceMap, assetInfo, module, compilation) {
    const { buildInfo, createSourceForAsset } = module
    const { options } = compilation
    if (!buildInfo.assets) {
      buildInfo.assets = Object.create(null)
      buildInfo.assetsInfo = new Map()
    }
    buildInfo.assets[name] = createSourceForAsset(
      options.context,
      name,
      content,
      sourceMap,
      compilation.compiler.root
    )
    buildInfo.assetsInfo.set(name, assetInfo)
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    const mode = mpx.mode
    const resource = module.resource
    const { resourcePath, queryObj } = parseRequest(resource)
    const type = queryObj.type
    const index = queryObj.index
    const isStatic = queryObj.isStatic
    const issuerFile = queryObj.issuerFile
    const fromImport = queryObj.fromImport
    const file = mpx.getExtractedFile(resource, {
      warn: (err) => {
        this.emitWarning(err)
      },
      error: (err) => {
        this.emitError(err)
      }
    })

    let request = this.remainingRequest
    // static的情况下需要添加recordLoader记录相关静态资源的输出路径
    if (isStatic) {
      const recordLoader = normalize.lib('record-loader')
      request = `${recordLoader}!${request}`
    }

    ExtractorDependency.importModule(`!!${request}`, {}, module, compilation, (err, content) => {
      if (err) return callback(err)
      // 处理wxss-loader的返回
      if (Array.isArray(content)) {
        content = content.map((item) => {
          return item[1]
        }).join('\n')
      }

      ExtractorDependency.emitFile(file, '', undefined, {
        skipEmit: true,
        extractedInfo: {
          content,
          index
        }
      }, module, compilation)

      let resultSource = ''
      const { buildInfo } = module
      const assetInfo = buildInfo.assetsInfo && buildInfo.assetsInfo.get(resourcePath)
      if (assetInfo && assetInfo.extractedResultSource) {
        resultSource = assetInfo.extractedResultSource
      }

      if (isStatic) {
        switch (type) {
          // styles为static就两种情况，一种是.mpx中使用src引用样式，第二种为css-loader中处理@import
          // 为了支持持久化缓存，.mpx中使用src引用样式对issueFile asset产生的副作用迁移到ExtractDependency中处理
          case 'styles':
            if (issuerFile) {
              let relativePath = toPosix(path.relative(path.dirname(issuerFile), file))
              relativePath = fixRelative(relativePath, mode)
              if (fromImport) {
                resultSource += `module.exports = ${JSON.stringify(relativePath)};\n`
              } else {
                ExtractorDependency.emitFile(issuerFile, '', undefined, {
                  skipEmit: true,
                  extractedInfo: {
                    content: `@import "${relativePath}";\n`,
                    index: -1
                  }
                }, module, compilation)
              }
            }
            break
          case 'template':
            resultSource += `module.exports = __webpack_public_path__ + ${JSON.stringify(file)};\n`
            break
          case 'json':
            // 目前json为static时只有处理theme.json一种情况，该情况下返回的路径只能为不带有./或../开头的相对路径，否则微信小程序预览构建会报错，issue#622
            resultSource += `module.exports = ${JSON.stringify(file)};\n`
            break
        }
      }

      this.resultSource = resultSource
      callback()
    })
  }

  serialize (context) {
    const { write } = context
    write(this.remainingRequest)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.remainingRequest = read()
    super.deserialize(context)
  }
}

ExtractorDependency.Template = class ExtractorDependencyTemplate {
  apply (dep, source) {
    if (dep.resultSource) {
      // 完全替换之前模块的返回内容
      source.replace(0, Infinity, dep.resultSource)
    }
  }
}

makeSerializable(ExtractorDependency, '@mpxjs/webpack-plugin/lib/dependencies/ExtractorDependency')

module.exports = ExtractorDependency
