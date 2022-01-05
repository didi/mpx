const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')
const InitFragment = require('webpack/lib/InitFragment')

class RuntimeCodeDependency extends ModuleDependency {
  constructor (request) {
    super(request)
  }

  get type () {
    return 'mpx partial compile runtime code'
  }
}

RuntimeCodeDependency.Template = class RuntimeCodeDependencyTemplate {
  apply (
    dependency,
		source,
		{
			runtimeTemplate,
			moduleGraph,
			chunkGraph,
			initFragments,
			runtimeRequirements
		}
  ) {
    const dep = dependency
		initFragments.push(
			new InitFragment(
        `/* mpx partial compile runtime dependency */${runtimeTemplate.moduleExports({
					module: moduleGraph.getModule(dep),
					chunkGraph,
					request: dep.request,
					runtimeRequirements
				})}\n`
        ,
				0,
				-1,
				`mpx partial compile ${dep.request}`
			)
		);
  }
}

makeSerializable(RuntimeCodeDependency, '@mpxjs/webpack-plugin/lib/partial-compile/dependencies/RuntimeCodeDependency')

module.exports = RuntimeCodeDependency
