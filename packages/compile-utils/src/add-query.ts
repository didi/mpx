import parseRequest from './parse-request'
import stringifyQuery from './stringify-query'
import t from './type'

// 默认为非强行覆盖原query，如需强行覆盖传递force为true
export function addQuery(
  request: any,
  data: any = {},
  force?: any,
  removeKeys?: any[]
) {
  const {
    rawResourcePath: resourcePath,
    loaderString,
    queryObj: queryObjRaw
  } = parseRequest(request)
  const queryObj = Object.assign({}, queryObjRaw)
  if (force) {
    Object.assign(queryObj, data)
  } else {
    Object.keys(data).forEach(key => {
      if (!queryObj.hasOwnProperty(key)) {
        queryObj[key] = data[key]
      }
    })
  }

  if (removeKeys) {
    if (t(removeKeys) === 'String') {
      removeKeys = [removeKeys]
    }
    removeKeys.forEach(key => {
      delete queryObj[key]
    })
  }

  return (
    (loaderString ? `${loaderString}!` : '') +
    resourcePath +
    stringifyQuery(queryObj)
  )
}
