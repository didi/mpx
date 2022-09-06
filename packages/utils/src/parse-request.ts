import { OptionObject, parseQuery } from 'loader-utils'
const seen = new Map()
const path = require('path')

function genQueryObj(result: { queryObj: OptionObject; resourceQuery: any }) {
  // 避免外部修改queryObj影响缓存
  result.queryObj = parseQuery(result.resourceQuery || '?')
  return result as any
}

export default function parseRequest(request: string) {
  if (seen.has(request)) {
    return genQueryObj(seen.get(request))
  }
  let elements = request.split('!')
  let resource = elements.pop() as string
  let loaderString = elements.join('!')
  let resourcePath = resource
  let resourceQuery = ''
  const queryIndex = resource.indexOf('?')
  if (queryIndex >= 0) {
    resourcePath = resource.slice(0, queryIndex)
    resourceQuery = resource.slice(queryIndex)
  }
  const queryObj = parseQuery(resourceQuery || '?')
  const rawResourcePath = resourcePath
  if (queryObj.resourcePath) {
    resourcePath = queryObj.resourcePath as string
  } else if (queryObj.infix) {
    const resourceDir = path.dirname(resourcePath)
    const resourceBase = path.basename(resourcePath)
    resourcePath = path.join(
      resourceDir,
      resourceBase.replace(queryObj.infix, '')
    )
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
