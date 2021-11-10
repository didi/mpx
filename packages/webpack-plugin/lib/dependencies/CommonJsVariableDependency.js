const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class CommonJsVariableDependency extends ModuleDependency {
  constructor (request, name) {
    super(request)
    this.name = name
  }

  serialize (context) {
    const { write } = context
    write(this.name)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.name = read()
    super.deserialize(context)
  }

  updateHash (hash, context) {
    hash.update(this.request)
    hash.update(this.name)
    super.updateHash(hash, context)
  }

  get type () {
    return 'mpx cjs variable'
  }

  get category () {
    return 'commonjs'
  }
}

CommonJsVariableDependency.Template = class CommonJsVariableDependencyTemplate extends (
  ModuleDependency.Template
) {
  apply (
    dep,
    source,
    {
      runtimeTemplate,
      moduleGraph,
      chunkGraph,
      runtimeRequirements
    }
  ) {
    if (!dep.name) return
    const importedModule = moduleGraph.getModule(dep)
    let requireExpr = runtimeTemplate.moduleExports({
      module: importedModule,
      chunkGraph,
      request: dep.request,
      weak: dep.weak,
      runtimeRequirements
    })

    requireExpr = `/* mpx cjs variable */ var ${dep.name} = ` + requireExpr

    source.insert(0, requireExpr)
  }
}

makeSerializable(
  CommonJsVariableDependency,
  '@mpxjs/webpack-plugin/lib/dependencies/CommonJsVariableDependency'
)

module.exports = CommonJsVariableDependency
