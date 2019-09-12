const parseQuery = require('loader-utils').parseQuery

module.exports = function getResourceId (resource) {
  let queryIndex = request.indexOf('?')
  let query = '?'
  let resourcePath = resource
  if (queryIndex > -1) {
    resourcePath = request.slice(0, queryIndex)
    query = request.slice(queryIndex)
  }
  const queryObj = parseQuery(query)


  if (queryObj.resourcePath) {
    return queryObj.resourcePath
  }
  return resourcePath
}
