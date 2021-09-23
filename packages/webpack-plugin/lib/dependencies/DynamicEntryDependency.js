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

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    let { resource, entryType, outputPath, packageRoot } = this
    if (packageRoot && mpx.currentPackageRoot !== packageRoot) {
      mpx.subpackagesEntriesMap[packageRoot] = mpx.subpackagesEntriesMap[packageRoot] || []
      mpx.subpackagesEntriesMap[packageRoot].push(this)
      this.module = module
      return callback()
    } else {
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
      this.module = null
      this.filename = filename
      this.publicPath = compilation.outputOptions.publicPath || ''
      mpx.addEntry(resource, filename, entryType, (err, entryModule) => {
        if (err) return callback(err)
        // todo entry的父子关系可以在这里建立
        return callback(null, entryModule)
      })
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
    const { filename, relativePath, range, publicPath } = dep
    let result
    if (relativePath) {
      result = toPosix(path.relative(relativePath, filename))
    } else {
      result = publicPath + filename
    }
    source.replace(range[0], range[1] - 1, result)
  }
}

makeSerializable(DynamicEntryDependency, '@mpxjs/webpack-plugin/lib/dependencies/DynamicEntryDependency')

module.exports = DynamicEntryDependency
