const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')
const path = require('path')
const addQuery = require('../utils/add-query')
const toPosix = require('../utils/to-posix')
const async = require('async')
const parseRequest = require('../utils/parse-request')
const { MPX_CURRENT_CHUNK } = require('../utils/const')

class DynamicEntryDependency extends NullDependency {
  constructor (request, entryType, outputPath = '', packageRoot = '', relativePath = '', context = '', range) {
    super()
    this.request = request
    this.entryType = entryType
    this.outputPath = outputPath
    this.packageRoot = packageRoot
    this.relativePath = relativePath
    this.context = context
    this.range = range
  }

  get type () {
    return 'mpx dynamic entry'
  }

  get key () {
    const { request, entryType, outputPath, packageRoot, relativePath, context, range } = this
    return toPosix([request, entryType, outputPath, packageRoot, relativePath, context, ...range].join('|'))
  }

  addEntry (compilation, callback) {
    const mpx = compilation.__mpx__
    let { request, entryType, outputPath, relativePath, context, originEntryNode, publicPath, resolver } = this

    async.waterfall([
      (callback) => {
        if (context && resolver) {
          resolver.resolve({}, context, request, {}, (err, resource) => {
            callback(err, resource)
          })
        } else {
          callback(null, request)
        }
      },
      (resource, callback) => {
        if (!outputPath) {
          const { resourcePath } = parseRequest(resource)
          outputPath = mpx.getOutputPath(resourcePath, entryType)
        }

        const { packageRoot, outputPath: filename, alreadyOutputted } = mpx.getPackageInfo({
          resource,
          outputPath,
          resourceType: entryType,
          warn (e) {
            compilation.warnings.push(e)
          },
          error (e) {
            compilation.errors.push(e)
          }
        })

        let resultPath = publicPath + filename
        if (relativePath && relativePath !== MPX_CURRENT_CHUNK) {
          resultPath = toPosix(path.relative(relativePath, resultPath))
        }

        // export类型的resultPath需要添加.js后缀
        if (entryType === 'export') resultPath += '.js'

        if (alreadyOutputted) return callback(null, { resultPath })

        // 对于常规js模块不应添加packageRoot避免冗余
        if (packageRoot && entryType !== 'export') {
          resource = addQuery(resource, { packageRoot }, true)
        }

        mpx.addEntry(resource, filename, (err, entryModule) => {
          if (err) return callback(err)
          if (entryType === 'export') {
            mpx.exportModules.add(entryModule)
          }
          originEntryNode.addChild(mpx.getEntryNode(entryModule, entryType))
          return callback(null, {
            resultPath,
            entryModule
          })
        })
      }
    ], callback)
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    const { packageRoot, context } = this
    this.originEntryNode = mpx.getEntryNode(module)
    this.publicPath = compilation.outputOptions.publicPath || ''
    if (context) this.resolver = compilation.resolverFactory.get('normal', module.resolveOptions)
    // 分包构建在需要在主包构建完成后在finishMake中处理，返回的资源路径先用key来占位，在合成extractedAssets时再进行最终替换
    if (packageRoot && mpx.currentPackageRoot !== packageRoot) {
      mpx.subpackagesEntriesMap[packageRoot] = mpx.subpackagesEntriesMap[packageRoot] || []
      mpx.subpackagesEntriesMap[packageRoot].push(this)
      callback()
    } else {
      this.addEntry(compilation, (err, { resultPath }) => {
        if (err) return callback(err)
        this.resultPath = resultPath
        callback()
      })
    }
  }

  // hash会影响最终的codeGenerateResult是否走缓存，由于该dep中resultPath是动态变更的，需要将其更新到hash中，避免错误使用缓存
  updateHash (hash, context) {
    const { resultPath, relativePath } = this
    if (resultPath) hash.update(resultPath)
    // relativePath为MPX_CURRENT_CHUNK时，插入随机hash使当前module的codeGeneration cache失效，从而执行dep.apply动态获取当前module所属的chunk路径
    if (relativePath === MPX_CURRENT_CHUNK) hash.update('' + (+new Date()) + Math.random())
    super.updateHash(hash, context)
  }

  serialize (context) {
    const { write } = context
    write(this.request)
    write(this.entryType)
    write(this.outputPath)
    write(this.packageRoot)
    write(this.relativePath)
    write(this.context)
    write(this.range)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.request = read()
    this.entryType = read()
    this.outputPath = read()
    this.packageRoot = read()
    this.relativePath = read()
    this.context = read()
    this.range = read()
    super.deserialize(context)
  }
}

DynamicEntryDependency.Template = class DynamicEntryDependencyTemplate {
  apply (dep, source, {
    module,
    chunkGraph
  }) {
    let { resultPath, range, key, outputPath, relativePath, publicPath } = dep
    if (outputPath === 'custom-tab-bar/index') {
      // replace with true for custom-tab-bar
      source.replace(range[0], range[1] - 1, 'true')
    } else if (resultPath) {
      if (relativePath === MPX_CURRENT_CHUNK) {
        relativePath = publicPath + path.dirname(chunkGraph.getModuleChunks(module)[0].name)
        resultPath = toPosix(path.relative(relativePath, resultPath))
      }
      source.replace(range[0], range[1] - 1, JSON.stringify(resultPath))
    } else {
      const replaceRange = `mpx_replace_path_${key}`
      source.replace(range[0], range[1] - 1, JSON.stringify(replaceRange))
    }
  }
}

makeSerializable(DynamicEntryDependency, '@mpxjs/webpack-plugin/lib/dependencies/DynamicEntryDependency')

module.exports = DynamicEntryDependency
