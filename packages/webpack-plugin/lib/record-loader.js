const parseRequest = require('./utils/parse-request')
const RecordResourceMapDependency = require('./dependencies/RecordResourceMapDependency')

module.exports = function (source) {
  const mpx = this.getMpx()
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const file = mpx.getExtractedFile(this.resource)
  const packageRoot = queryObj.packageRoot || ''
  this._module.addPresentationalDependency(new RecordResourceMapDependency(resourcePath, 'staticResource', file, packageRoot))
  return source
}
