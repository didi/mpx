import parseRequest from './parse-request'
import { LoaderContext } from 'webpack'

// todo 提供不记录dependency的resolve方法，非必要的情况下不记录dependency，提升缓存利用率
export default (
  context: string,
  request: string,
  loaderContext: LoaderContext<null>,
): any => {
  const { queryObj } = parseRequest(request)
  context = queryObj.context || context
  return new Promise((resolve, reject) => {
    loaderContext.resolve(context, request, (err, resource, info) => {
      if (err) return reject(err)
      if (resource === false) return reject(new Error('Resolve ignored!'))
      resolve({ resource, info })
  })
}
