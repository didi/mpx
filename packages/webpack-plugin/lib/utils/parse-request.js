const parseQuery = require('loader-utils').parseQuery
const seen = new Map()

function genQueryObj (result) {
  // 避免外部修改queryObj影响缓存
  result.queryObj = parseQuery(result.resourceQuery)
  return result
}

module.exports = function parseRequest (request) {
  if (seen.has(request)) {
    return genQueryObj(seen.get(request))
  }
  let elements = request.split('!')
  let resource = elements.pop()
  let loaderString = elements.join('!')
  let resourcePath = resource
  let resourceQuery = '?'
  const queryIndex = resource.indexOf('?')
  if (queryIndex >= 0) {
    resourcePath = resource.slice(0, queryIndex)
    resourceQuery = resource.slice(queryIndex)
  }
  const queryObj = parseQuery(resourceQuery)
  const rawResourcePath = resourcePath
  if (queryObj.resourcePath) {
    resourcePath = queryObj.resourcePath
  }
  const result = {
    resource,
    loaderString,
    resourcePath,
    resourceQuery,
    rawResourcePath,
    queryObj
  }
  seen.set(request, result)
  return result
}
