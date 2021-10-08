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
    dependency,
    source,
    {
      module,
      runtimeTemplate,
      moduleGraph,
      chunkGraph,
      runtimeRequirements,
      runtime,
      initFragments
    }
  ) {
    const dep = dependency
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
