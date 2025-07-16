const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency')
const { RetryRuntimeGlobal } = require('../retry-runtime-module')

class ImportDependencyTemplate extends (
  ModuleDependency.Template
) {
  constructor (options = {}) {
    super()
    this.retryRequireAsync = options.retryRequireAsync
  }

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
    if (dep.isRequireAsync && this.retryRequireAsync && this.retryRequireAsync.times > 0) {
      runtimeRequirements.add(RetryRuntimeGlobal)
      content = `${RetryRuntimeGlobal}(function() { return ${content} }, ${this.retryRequireAsync.times}, ${this.retryRequireAsync.interval})`
    }

    source.replace(dep.range[0], dep.range[1] - 1, content)
  }
}

module.exports = ImportDependencyTemplate
