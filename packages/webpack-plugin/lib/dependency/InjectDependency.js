'use strict'
const NullDependency = require('webpack/lib/dependencies/NullDependency')

class InjectDependency extends NullDependency {
  constructor (options) {
    super()
    this.content = options.content
    this.index = options.index || 0
  }

  get type () {
    return 'mpx inject'
  }

  updateHash (hash) {
    super.updateHash(hash)
    hash.update(this.content)
  }
}

InjectDependency.Template = class InjectDependencyTemplate {
  apply (dep, source) {
    source.insert(dep.index, '/* mpx inject */ ' + dep.content)
  }
}

module.exports = InjectDependency
