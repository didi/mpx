const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class CommonJsExtractDependency extends ModuleDependency {
  constructor (request, range) {
    super(request)
    this.range = range
  }

  updateHash (hash, context) {
    hash.update(this.weak + '')
    super.updateHash(hash, context)
  }

  get type () {
    return 'mpx cjs extract'
  }

  get category () {
    return 'commonjs'
  }
}

CommonJsExtractDependency.Template = class CommonJsExtractDependencyTemplate extends (
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
    let content = ''
    if (!dep.weak) {
      content = runtimeTemplate.moduleExports({
        module: moduleGraph.getModule(dep),
        chunkGraph,
        request: dep.request,
        weak: dep.weak,
        runtimeRequirements
      })
    }
    source.replace(dep.range[0], dep.range[1] - 1, content)
  }
}

makeSerializable(
  CommonJsExtractDependency,
  '@mpxjs/webpack-plugin/lib/dependencies/CommonJsExtractDependency'
)

module.exports = CommonJsExtractDependency
