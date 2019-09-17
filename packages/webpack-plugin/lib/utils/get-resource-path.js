const parseQuery = require('loader-utils').parseQuery

module.exports = function getResourceId (resource) {
  let queryIndex = resource.indexOf('?')
  let query = '?'
  let resourcePath = resource
  if (queryIndex > -1) {
    resourcePath = resource.slice(0, queryIndex)
    query = resource.slice(queryIndex)
  }
  const queryObj = parseQuery(query)

  if (queryObj.resourcePath) {
    return queryObj.resourcePath
  }
  return resourcePath
}
