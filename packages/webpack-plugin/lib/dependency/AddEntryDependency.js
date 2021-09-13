const NullDependency = require('webpack/lib/dependencies/NullDependency')

class AddEntryDependency extends NullDependency {
  constructor ({context, dep, name}) {
    super()
    this.__addEntryParams = [ context, dep, name ]
  }

  get type () {
    return 'mpx add entry'
  }

  // updateHash (hash) {
  //   super.updateHash(hash)
  //   hash.update(this.childCompileEntryModule.identifier())
  // }
}

AddEntryDependency.Template = class AddEntryDependencyTemplate {
  apply () {
  }
}

module.exports = AddEntryDependency
