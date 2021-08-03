const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')
const path = require('path')
const toPosix = require('../utils/to-posix')
const fixRelative = require('../utils/fix-relative')

class ExtractDependency extends NullDependency {
  constructor (content, file, index, options = {}) {
    super()
    this.content = content
    this.file = file
    this.index = index
    this.options = options
  }

  get type () {
    return 'mpx extract'
  }

  updateHash (hash) {
    super.updateHash(hash)
    hash.update(this.content)
  }

  depAction (compilation) {
    const mpx = compilation.__mpx__
    if (!mpx) return
    const additionalAssets = mpx.additionalAssets
    const mode = mpx.mode
    const content = this.content
    const file = this.file
    const index = this.index === -1 ? 0 : this.index
    const type = this.options.type

    additionalAssets[file] = additionalAssets[file] || []
    if (!additionalAssets[file][index]) {
      additionalAssets[file][index] = content
    }

    if (type === 'styles' && this.index === -1) {
      const issuerFile = this.options.issuerFile
      const fromImport = this.options.fromImport
      if (issuerFile && !fromImport) {
        const relativePath = fixRelative(toPosix(path.relative(path.dirname(issuerFile), file)), mode)
        additionalAssets[issuerFile] = additionalAssets[issuerFile] || []
        additionalAssets[issuerFile].prefix = additionalAssets[issuerFile].prefix || []
        additionalAssets[issuerFile].prefix.push(`@import "${relativePath}";\n`)
      }
    }
  }

  serialize (context) {
    const { write } = context
    write(this.content)
    write(this.file)
    write(this.index)
    write(this.options)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.content = read()
    this.file = read()
    this.index = read()
    this.options = read()
    super.deserialize(context)
  }
}

ExtractDependency.Template = class ExtractDependencyTemplate {
  apply () {
  }
}

makeSerializable(ExtractDependency, '@mpxjs/webpack-plugin/lib/dependencies/ExtractDependency')

module.exports = ExtractDependency
