'use strict'
const NullDependency = require('webpack/lib/dependencies/NullDependency')

class InjectDependency extends NullDependency {
  constructor (options) {
    super()
    this.content = options.content
    this.index = options.index || 0
  }

  get type () {
    return 'navigator'
  }
}

InjectDependency.Template = class InjectDependencyTemplate {
  apply (dep, source) {
    source.insert(dep.index, '/* mpx global inject */ ' + dep.content)
  }
}

module.exports = InjectDependency
