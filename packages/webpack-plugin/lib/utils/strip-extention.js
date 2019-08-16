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

    let result

    if (queryObj.__resource) {
      result = queryObj.__resource
    } else {
      const parsed = path.parse(resource)
      result = path.join(parsed.dir, parsed.name)
    }
    // 疑似与内联wxs处理相关，无法复现问题，暂时移除该副作用逻辑
    // seen[request] = result.replace(/\\/g, '/')
    seen[request] = result
  }
  return seen[request]
}

module.exports = stripExtension
