const parseRequest = require('./utils/parse-request')
const RecordStaticResourceDependency = require('./dependencies/RecordStaticResourceDependency')

module.exports = function (source) {
  const mpx = this.getMpx()
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const file = mpx.getExtractedFile(this.resource)
  const packageRoot = queryObj.packageRoot || ''
  this._module.addPresentationalDependency(new RecordStaticResourceDependency(resourcePath, file, packageRoot))
  return source
}
