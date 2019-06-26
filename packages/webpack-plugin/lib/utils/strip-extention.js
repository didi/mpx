const path = require('path')
const seen = {}
const parseQuery = require('loader-utils').parseQuery

function stripExtension (request) {
  if (typeof request !== 'string' || request === '') return request
  if (!seen[request]) {
    let queryIndex = request.indexOf('?')
    let resource = request
    let query = '?'
    if (queryIndex > -1) {
      resource = request.slice(0, queryIndex)
      query = request.slice(queryIndex)
    }
    const queryObj = parseQuery(query)

    if (queryObj.__resource) {
      seen[request] = queryObj.__resource
    } else {
      const parsed = path.parse(resource)
      seen[request] = path.join(parsed.dir, parsed.name)
    }
  }
  return seen[request]
}

module.exports = stripExtension
