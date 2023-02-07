import path from 'path'
import { OptionObject, parseQuery } from 'loader-utils'
const seen = new Map()

export interface Result {
  resource: string
  loaderString: string
  resourcePath: string
  resourceQuery: string
  rawResourcePath: string
  queryObj: OptionObject
}

function genQueryObj(result: Result) {
  // 避免外部修改queryObj影响缓存
  result.queryObj = parseQuery(result.resourceQuery || '?')
  return result
}

export function parseRequest(request: string) {
  if (seen.has(request)) {
    return genQueryObj(seen.get(request))
  }
  const elements = request.split('!')
  const resource = elements.pop() as string
  const loaderString = elements.join('!')
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
      resourceBase.replace(queryObj.infix as string, '')
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
