const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class CommonJsAsyncDependency extends ModuleDependency {
  constructor (request, range) {
    super(request)
    this.range = range
  }

  get type () {
    return 'mpx cjs async'
  }

  get category () {
    return 'commonjs'
  }
}

CommonJsAsyncDependency.Template = class CommonJsAsyncDependencyTemplate extends (
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
    const requireExpr = runtimeTemplate.moduleExports({
      module: moduleGraph.getModule(dep),
      chunkGraph,
      request: dep.request,
      weak: dep.weak,
      runtimeRequirements
    })

    const content = `Promise.resolve(${requireExpr})`

    source.replace(dep.range[0], dep.range[1] - 1, content)
  }
}

makeSerializable(
  CommonJsAsyncDependency,
  '@mpxjs/webpack-plugin/lib/dependencies/CommonJsAsyncDependency'
)

module.exports = CommonJsAsyncDependency
