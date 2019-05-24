const parseQuery = require('loader-utils').parseQuery
const stringifyQuery = require('./stringify-query')

module.exports = function (request, data) {
  const queryIndex = request.indexOf('?')
  let query
  let resource = request
  if (queryIndex >= 0) {
    query = request.substr(queryIndex)
    resource = request.substr(0, queryIndex)
  }
  let queryObj = parseQuery(query || '?')
  Object.assign(queryObj, data)
  return resource + stringifyQuery(queryObj)
}
