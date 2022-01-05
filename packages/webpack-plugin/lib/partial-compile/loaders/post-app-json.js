const walk = require('acorn-walk')
const Parser = require('acorn').Parser
const ConstDependency = require('webpack/lib/dependencies/ConstDependency')

module.exports = function (content) {
  const loaderCallback = this.async()
  const partialCompilePlugin = this.getMpxPartialCompilePlugin()
  const currentModule = this._module
  if (partialCompilePlugin.shouldRemoveSubPackagesField()){
    const ast = Parser.parse(content, {
      ranges: true,
	    locations: true
    })
    walk.simple(ast, {
      ObjectExpression (node) {
        const properties = node.properties || []
        const subPackagesNode = properties.filter(property => {
          return property.key && (property.key.value === 'subPackages')
        })[0]
        if (subPackagesNode) {
          const hasTrailingComma = content[subPackagesNode.range[1]] === ','
          const range = hasTrailingComma ? [subPackagesNode.range[0], subPackagesNode.range[1] + 1] : [...subPackagesNode.range]
          let clearDep = new ConstDependency('', range)
          clearDep.loc = Object.create(subPackagesNode.loc)
          currentModule.addPresentationalDependency(clearDep)
        }
      }
    })
  }
  loaderCallback(null, content)
}
