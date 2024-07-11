const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')
const path = require('path')
const addQuery = require('../utils/add-query')
const toPosix = require('../utils/to-posix')
const async = require('async')
const parseRequest = require('../utils/parse-request')
const hasOwn = require('../utils/has-own')

class DynamicEntryDependency extends NullDependency {
  constructor (range, request, entryType, outputPath = '', packageRoot = '', relativePath = '', context = '', extraOptions = {}) {
    super()
    this.request = request
    this.entryType = entryType
    this.outputPath = outputPath
    this.packageRoot = packageRoot
    this.relativePath = relativePath
    this.context = context
    this.range = range

    if (typeof extraOptions === 'string') {
      extraOptions = JSON.parse(extraOptions)
    }
    this.extraOptions = extraOptions
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
    let { request, entryType, outputPath, relativePath, context, originEntryNode, publicPath, resolver, extraOptions } = this

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
        const { resourcePath } = parseRequest(resource)

        if (!outputPath) {
          outputPath = mpx.getOutputPath(resourcePath, entryType)
        }

        const { packageName, packageRoot, outputPath: filename, alreadyOutputted } = mpx.getPackageInfo({
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
        if (relativePath) {
          resultPath = toPosix(path.relative(relativePath, resultPath))
        }

        // export类型的resultPath需要添加.js后缀
        if (entryType === 'export') resultPath += '.js'

        // 对于常规js模块不应添加packageRoot避免冗余
        if (packageRoot && entryType !== 'export') {
          resource = addQuery(resource, { packageRoot }, true)
        }

        const key = [resource, filename].join('|')

        if (alreadyOutputted) {
          const addEntryPromise = mpx.addEntryPromiseMap.get(key)
          if (addEntryPromise) {
            addEntryPromise.then(entryModule => {
              // 构建entry依赖图，针对alreadyOutputted的entry也需要记录
              originEntryNode.addChild(mpx.getEntryNode(entryModule, entryType))
            })
          }
          if (mpx.dynamicEntryInfo[packageName] && extraOptions.isAsync) {
            mpx.dynamicEntryInfo[packageName].entries.forEach(entry => {
              if (entry.resource === resource && entry.filename === filename && entry.entryType === entryType) {
                entry.hasAsync = true
              }
              return entry
            })
          }
          // alreadyOutputted时直接返回，避免存在模块循环引用时死循环
          return callback(null, { resultPath })
        } else {
          const addEntryPromise = new Promise((resolve, reject) => {
            mpx.addEntry(resource, filename, (err, entryModule) => {
              if (err) return reject(err)
              if (entryType === 'export') {
                mpx.exportModules.add(entryModule)
              }
              resolve(entryModule)
            })
          })
          addEntryPromise
            .then(entryModule => {
              originEntryNode.addChild(mpx.getEntryNode(entryModule, entryType))
              callback(null, { resultPath })
            })
            .catch(err => callback(err))

          mpx.addEntryPromiseMap.set(key, addEntryPromise)
          mpx.collectDynamicEntryInfo({
            resource,
            packageName,
            filename,
            entryType,
            hasAsync: extraOptions.isAsync || false
          })
        }
      }
    ], callback)
  }

  mpxAction (module, compilation, callback) {
    const { __mpx__: mpx, moduleGraph } = compilation
    let entryModule = module
    while (true) {
      const issuer = moduleGraph.getIssuer(entryModule)
      if (issuer) entryModule = issuer
      else break
    }
    this.originEntryNode = mpx.getEntryNode(entryModule)
    this.publicPath = compilation.outputOptions.publicPath || ''
    const { packageRoot, context } = this
    if (context) this.resolver = compilation.resolverFactory.get('normal', module.resolveOptions)
    // post 分包队列在 sub 分包队列构建完毕后进行
    if (this.extraOptions.postSubpackageEntry) {
      mpx.postSubpackageEntriesMap[packageRoot] = mpx.postSubpackageEntriesMap[packageRoot] || []
      mpx.postSubpackageEntriesMap[packageRoot].push(this)
      callback()
      return
    }
    // 分包构建在需要在主包构建完成后在finishMake中处理，返回的资源路径先用key来占位，在合成extractedAssets时再进行最终替换
    if (packageRoot && mpx.currentPackageRoot !== packageRoot) {
      mpx.subpackagesEntriesMap[packageRoot] = mpx.subpackagesEntriesMap[packageRoot] || []
      mpx.subpackagesEntriesMap[packageRoot].push(this)
      callback()
    } else {
      this.addEntry(compilation, (err, result) => {
        if (err) return callback(err)
        this.resultPath = result.resultPath
        callback()
      })
    }
  }

  // hash会影响最终的codeGenerateResult是否走缓存，由于该dep中resultPath是动态变更的，需要将其更新到hash中，避免错误使用缓存
  updateHash (hash, context) {
    const { resultPath, extraOptions } = this
    if (resultPath) hash.update(resultPath)
    // 当处理require.async时，插入随机hash使当前module的codeGeneration cache失效，从而执行dep.apply动态获取当前module所属的chunk路径
    if (extraOptions.isRequireAsync) hash.update('' + (+new Date()) + Math.random())
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
    write(this.extraOptions)
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
    this.extraOptions = read()
    super.deserialize(context)
  }
}

DynamicEntryDependency.Template = class DynamicEntryDependencyTemplate {
  apply (dep, source, {
    module,
    chunkGraph
  }) {
    const { resultPath, range, key, publicPath, extraOptions } = dep

    let replaceContent = ''

    if (hasOwn(extraOptions, 'replaceContent')) {
      replaceContent = extraOptions.replaceContent
    } else if (resultPath) {
      if (extraOptions.isRequireAsync) {
        let relativePath = toPosix(path.relative(publicPath + path.dirname(chunkGraph.getModuleChunks(module)[0].name), resultPath))
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath
        replaceContent = JSON.stringify(relativePath)
        if (extraOptions.retryRequireAsync) {
          replaceContent += `).catch(function (e) {
  return require.async(${JSON.stringify(relativePath)});
}`
        }
      } else {
        replaceContent = JSON.stringify(resultPath)
      }
    } else {
      replaceContent = JSON.stringify(`mpx_replace_path_${key}`)
    }

    if (replaceContent) source.replace(range[0], range[1] - 1, replaceContent)
  }
}

makeSerializable(DynamicEntryDependency, '@mpxjs/webpack-plugin/lib/dependencies/DynamicEntryDependency')

module.exports = DynamicEntryDependency
