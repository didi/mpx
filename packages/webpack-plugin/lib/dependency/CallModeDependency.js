'use strict'
const NullDependency = require('webpack/lib/dependencies/NullDependency')

class CallModeDependency extends NullDependency {
  constructor (options) {
    super()
    this.mode = options.mode
    this.index = options.index
  }

  get type () {
    return 'navigator'
  }

  updateHash (hash) {
    super.updateHash(hash)
    hash.update(this.mode)
  }
}

CallModeDependency.Template = class InjectDependencyTemplate {
  apply (dep, source) {
    source.insert(dep.index, `, ${JSON.stringify(dep.mode)}`)
  }
}

module.exports = CallModeDependency
