const ResolveDependency = require('../../dependencies/ResolveDependency')
const registerNotSerializable = require('webpack/lib/util/serialization').registerNotSerializable
const parseRequest = require('../../utils/parse-request')

class PartialCompileResolveDependency extends ResolveDependency {
  constructor (partialCompilePlugin, resource, packageName, issuerResource, range) {
    super(resource, packageName, issuerResource, range)
    this.partialCompilePlugin = partialCompilePlugin
  }

  get type () {
    return 'mpx partial compile'
  }

  getResolved () {
    const { resourcePath } = parseRequest(this.resource)
    const matchedPageRecord = this.partialCompilePlugin.pagesRecord.filter(record => record.resourcePath === resourcePath)
    const length = matchedPageRecord.length
    // TODO 暂时与现有逻辑保持一致
    if (length) {
      return matchedPageRecord[length - 1].miniPagePath
    } else {
      return super.getResolved()
    }
  }

  updateHash (hash, context) {
    this.resolved = this.getResolved()
    const { resource, issuerResource, compilation } = this
    if (this.resolved) {
      hash.update(this.resolved)
    } else {
      compilation.errors.push(new Error(`Path ${resource} is not a page/component/static resource, which is resolved from ${issuerResource}!`))
    }
  }
}

PartialCompileResolveDependency.Template = class PartialCompileResolveDependencyTemplate extends ResolveDependency.Template {
}

registerNotSerializable(PartialCompileResolveDependency)


module.exports = PartialCompileResolveDependency
