const NullDependency = require('webpack/lib/dependencies/NullDependency')

class ChildCompileDependency extends NullDependency {
  constructor (module) {
    super()
    this.childCompileEntryModule = module
  }

  get type () {
    return 'mpx child compile'
  }

  updateHash (hash) {
    super.updateHash(hash)
    hash.update(this.childCompileEntryModule.identifier())
  }
}

ChildCompileDependency.Template = class ChildCompileDependencyTemplate {
  apply () {
  }
}

module.exports = ChildCompileDependency
