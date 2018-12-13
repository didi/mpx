const path = require('path')
const seen = {}

function stripExtension (request) {
  if (typeof request !== 'string' || request === '') return request
  if (!seen[request]) {
    let queryIndex = request.indexOf('?')
    let resource = request
    if (queryIndex > -1) {
      resource = request.slice(0, queryIndex)
    }
    let parsed = path.parse(resource)
    seen[request] = path.join(parsed.dir, parsed.name)
  }
  return seen[request]
}

module.exports = stripExtension
