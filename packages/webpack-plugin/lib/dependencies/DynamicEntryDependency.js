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
    return `${this.resource}_${this.entryType}_${this.outputPath}_${this.packageRoot}_${this.relativePath}_${this.range[0]}_${this.range[1]}`
  }

  addEntry (compilation, callback) {
    const mpx = compilation.__mpx__
    let { resource, entryType, outputPath, relativePath } = this
    const { packageRoot, outputPath: filename, alreadyOutputed } = mpx.getPackageInfo({
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

    if (alreadyOutputed) return callback()
    if (packageRoot) {
      resource = addQuery(resource, { packageRoot })
    }

    mpx.addEntry(resource, filename, (err, entryModule) => {
      if (err) return callback(err)
      if (entryType === 'export') {
        mpx.exportModules.add(entryModule)
      }
      // todo entry的父子关系可以在这里建立
      return callback(null, entryModule)
    })

    const publicPath = compilation.outputOptions.publicPath || ''
    let resultPath = publicPath + filename
    if (relativePath) {
      resultPath = toPosix(path.relative(relativePath, resultPath))
    }
    return resultPath
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    let { resource, entryType, outputPath, packageRoot } = this
    // 分包构建在需要在主包构建完成后在finishMake中处理，返回的资源路径先用key来占位，在合成extractedAssets时再进行最终替换
    if (packageRoot && mpx.currentPackageRoot !== packageRoot) {
      mpx.subpackagesEntriesMap[packageRoot] = mpx.subpackagesEntriesMap[packageRoot] || []
      mpx.subpackagesEntriesMap[packageRoot].push(this)
      return callback()
    } else {
      this.resultPath = this.addEntry(compilation, callback)
    }
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
    const { resultPath, range, key } = dep
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
