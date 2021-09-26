const ExtractorDependency = require('./dependencies/ExtractorDependency')

module.exports = content => content

module.exports.pitch = async function (remainingRequest) {
  const dep = new ExtractorDependency(remainingRequest)
  this._module.addPresentationalDependency(dep)
  return '// removed by extractor'
}
