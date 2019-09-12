const parseQuery = require('loader-utils').parseQuery
const stringifyQuery = require('./stringify-query')

module.exports = function (request, data) {
  const elements = request.split('!')
  const resource = elements.pop()
  const loaderString = elements.join('!')
  const queryIndex = resource.indexOf('?')
  let query = '?'
  let resourcePath = resource
  if (queryIndex >= 0) {
    query = resource.substr(queryIndex)
    resourcePath = resource.substr(0, queryIndex)
  }
  let queryObj = parseQuery(query)
  Object.assign(queryObj, data)
  return (loaderString ? `${loaderString}!` : '') + resourcePath + stringifyQuery(queryObj)
}
