const parseQuery = require('loader-utils').parseQuery
const stringifyQuery = require('./stringify-query')
const type = require('./type')

// 默认为非强行覆盖原query，如需强行覆盖传递force为false
module.exports = function (request, data, removeKeys, force) {
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
  if (force) {
    Object.assign(queryObj, data)
  } else {
    Object.keys(data).forEach((key) => {
      if (!queryObj.hasOwnProperty(key)) {
        queryObj[key] = data[key]
      }
    })
  }

  if (removeKeys) {
    if (type(removeKeys) === 'String') {
      removeKeys = [removeKeys]
    }
    removeKeys.forEach((key) => {
      delete queryObj[key]
    })
  }

  return (loaderString ? `${loaderString}!` : '') + resourcePath + stringifyQuery(queryObj)
}
