const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')
const path = require('path')
const addQuery = require('../utils/add-query')
const toPosix = require('../utils/to-posix')

class DynamicEntryDependency extends NullDependency {
  constructor (resource, entryType, outputPath = '', packageRoot = '', relativePath = '', range) {
    super()
    this.resource = resource
    this.entryType = entryType
    this.outputPath = outputPath
    this.packageRoot = packageRoot
    this.relativePath = relativePath
    this.range = range
  }

  get type () {
    return 'mpx dynamic entry'
  }

  get key () {
    const { resource, entryType, outputPath, packageRoot, relativePath, range } = this
    return toPosix([resource, entryType, outputPath, packageRoot, relativePath, ...range].join('|'))
  }

  addEntry (compilation, callback) {
    const mpx = compilation.__mpx__
    const publicPath = compilation.outputOptions.publicPath || ''
    let { resource, entryType, outputPath, relativePath, originEntryNode } = this

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
    if (relativePath) {
      resultPath = toPosix(path.relative(relativePath, resultPath))
    }

    // export类型的resultPath需要添加.js后缀
    if (entryType === 'export') resultPath += '.js'

    if (alreadyOutputted) return callback(null, { resultPath })

    if (packageRoot) {
      resource = addQuery(resource, { packageRoot })
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

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    const { packageRoot } = this
    this.originEntryNode = mpx.getEntryNode(module)
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
    const { resultPath } = this
    if (resultPath) hash.update(resultPath)
    super.updateHash(hash, context)
  }

  serialize (context) {
    const { write } = context
    write(this.resource)
    write(this.entryType)
    write(this.outputPath)
    write(this.packageRoot)
    write(this.relativePath)
    write(this.range)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.resource = read()
    this.entryType = read()
    this.outputPath = read()
    this.packageRoot = read()
    this.relativePath = read()
    this.range = read()
    super.deserialize(context)
  }
}

DynamicEntryDependency.Template = class DynamicEntryDependencyTemplate {
  apply (dep, source) {
    const { resultPath, range, key, outputPath } = dep
    // judgement for /custom-tab-bar/index
    if (outputPath === 'custom-tab-bar/index') return source.replace(range[0], range[1] - 1, 'true')
    if (resultPath) {
      source.replace(range[0], range[1] - 1, JSON.stringify(resultPath))
    } else {
      const replaceRange = `mpx_replace_path_${key}`
      source.replace(range[0], range[1] - 1, JSON.stringify(replaceRange))
    }
  }
}

makeSerializable(DynamicEntryDependency, '@mpxjs/webpack-plugin/lib/dependencies/DynamicEntryDependency')

module.exports = DynamicEntryDependency
