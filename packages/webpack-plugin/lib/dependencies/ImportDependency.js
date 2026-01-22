const Dependency = require('webpack/lib/Dependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')
const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency')
const { RetryRuntimeGlobal } = require('./RetryRuntimeModule')

class ImportDependency extends ModuleDependency {
  /**
   * @param {string} request the request
   * @param {[number, number]} range expression range
   * @param {string[][]=} referencedExports list of referenced exports
   */
  constructor (request, range, referencedExports, extraOptions) {
    super(request)
    this.range = range
    this.referencedExports = referencedExports
    this.extraOptions = extraOptions
  }

  get type () {
    return 'import()'
  }

  get category () {
    return 'esm'
  }

  /**
   * Returns list of exports referenced by this dependency
   * @param {ModuleGraph} moduleGraph module graph
   * @param {RuntimeSpec} runtime the runtime for which the module is analysed
   * @returns {(string[] | ReferencedExport)[]} referenced exports
   */
  getReferencedExports (moduleGraph, runtime) {
    return this.referencedExports
      ? this.referencedExports.map((e) => ({
          name: e,
          canMangle: false
        }))
      : Dependency.EXPORTS_OBJECT_REFERENCED
  }

  serialize (context) {
    context.write(this.range)
    context.write(this.referencedExports)
    context.write(this.extraOptions)
    super.serialize(context)
  }

  deserialize (context) {
    this.range = context.read()
    this.referencedExports = context.read()
    this.extraOptions = context.read()
    super.deserialize(context)
  }
}

makeSerializable(ImportDependency, '@mpxjs/webpack-plugin/lib/dependencies/ImportDependency')

ImportDependency.Template = class ImportDependencyTemplate extends (
  ModuleDependency.Template
) {
  /**
   * @param {Dependency} dependency the dependency for which the template should be applied
   * @param {ReplaceSource} source the current replace source which can be modified
   * @param {DependencyTemplateContext} templateContext the context object
   * @returns {void}
   */
  apply (
    dependency,
    source,
    { runtimeTemplate, module, moduleGraph, chunkGraph, runtimeRequirements }
  ) {
    const dep = /** @type {ImportDependency} */ (dependency)
    const block = /** @type {AsyncDependenciesBlock} */ (
      moduleGraph.getParentBlock(dep)
    )
    let content = runtimeTemplate.moduleNamespacePromise({
      chunkGraph,
      block: block,
      module: /** @type {Module} */ (moduleGraph.getModule(dep)),
      request: dep.request,
      strict: /** @type {BuildMeta} */ (module.buildMeta).strictHarmonyModule,
      message: 'import()',
      runtimeRequirements
    })
    // replace fakeType by 9 to fix require.async to commonjs2 module like 'module.exports = function(){...}'
    content = content.replace(/(__webpack_require__\.t\.bind\(.+,\s*)(\d+)(\s*\))/, (_, p1, p2, p3) => {
      return p1 + '9' + p3
    })

    // require.async 的场景且配置了重试次数才注入 RetryRuntimeModule
    const extraOptions = dep.extraOptions || {}
    if (extraOptions.isRequireAsync && extraOptions.retryRequireAsync && extraOptions.retryRequireAsync.times > 0) {
      runtimeRequirements.add(RetryRuntimeGlobal)
      content = `${RetryRuntimeGlobal}(function() { return ${content} }, ${extraOptions.retryRequireAsync.times}, ${extraOptions.retryRequireAsync.interval})`
    }

    source.replace(dep.range[0], dep.range[1] - 1, content)
  }
}

module.exports = ImportDependency
